// SFR-05 DB-level access control test.
//
// Talks to Supabase directly (PostgREST) as the `anon` and `authenticated` roles and
// checks what Row-Level Security / grants actually allow. It does not go through the
// Next.js app (which uses the service-role key and bypasses RLS), so it is the only test
// that proves the policies in docs/supabase-sfr05-rls.sql are live in the database.
//
// Run AFTER applying docs/supabase-sfr05-rls.sql:
//   npm run test:sfr05:rls
//
// Env (loaded from .env.local by the npm script):
//   SUPABASE_URL                 required
//   SUPABASE_SERVICE_ROLE_KEY    required (read-only lookups + cleanup of rows this test creates)
//   SUPABASE_ANON_KEY            required (Dashboard > Project Settings > API > anon / public key)
//   SUPABASE_JWT_SECRET          optional (Dashboard > Project Settings > API > JWT secret).
//                                Enables the `authenticated` role tests by minting short-lived
//                                tokens for existing users. Skipped with a warning if absent.

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!url || !serviceKey || !anonKey) {
  console.error('Missing env: need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY.');
  process.exit(1);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, opts);
const anon = createClient(url, anonKey, opts);

let passed = 0;
let failed = 0;
let skipped = 0;

function check(name, ok, details = '') {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'} ${name}${!ok && details ? ` -> ${details}` : ''}`);
}

function skip(name, why) {
  skipped++;
  console.log(`⚠️  SKIP ${name} -> ${why}`);
}

// "Denied" = PostgREST error OR zero rows came back (RLS filters silently on SELECT/UPDATE/DELETE).
const rowsOf = (res) => (res.error ? [] : res.data ?? []);

function clientFor(userId, role = 'authenticated') {
  const token = jwt.sign(
    { sub: userId, role, aud: 'authenticated', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 600 },
    jwtSecret,
  );
  return createClient(url, anonKey, { ...opts, global: { headers: { Authorization: `Bearer ${token}` } } });
}

// -----------------------------------------------------------------------------
// 1. Anonymous role
// -----------------------------------------------------------------------------
async function testAnon() {
  console.log('\n--- ANON ROLE ---');

  // Tables anon must never read. Skip the check if the table is empty (nothing to leak).
  const privateTables = [
    'users', 'event_registrations', 'announcement_comments', 'announcement_poll_responses',
    'discussion_groups', 'discussion', 'discussion_comments', 'notifications',
    'notification_preferences', 'tier_upgrade_requests', 'analytics_events', 'payment_methods',
  ];
  for (const t of privateTables) {
    const real = await service.from(t).select('*', { count: 'exact', head: true });
    if (real.error) { check(`service-role can read ${t}`, false, real.error.message); continue; }
    if (!real.count) { skip(`anon cannot read ${t}`, 'table is empty, nothing to leak'); continue; }
    const res = await anon.from(t).select('*').limit(5);
    check(`anon cannot read ${t}`, rowsOf(res).length === 0, `${rowsOf(res).length} row(s) leaked`);
  }

  // Public tables: anon may read only published/active + audience_type 'all'.
  const ev = rowsOf(await anon.from('events').select('status, audience_type'));
  check('anon events: only published + audience_type=all', ev.every((r) => r.status === 'published' && r.audience_type === 'all'), JSON.stringify(ev.filter((r) => r.status !== 'published' || r.audience_type !== 'all').slice(0, 3)));
  const an = rowsOf(await anon.from('announcements').select('status, audience_type'));
  check('anon announcements: only published + audience_type=all', an.every((r) => r.status === 'published' && r.audience_type === 'all'));
  const bn = rowsOf(await anon.from('benefits').select('is_active, audience_type'));
  check('anon benefits: only active + audience_type=all', bn.every((r) => r.is_active === true && r.audience_type === 'all'));

  // Anon writes must all fail and change nothing.
  const { data: someUser } = await service.from('users').select('id, first_name').limit(1).maybeSingle();
  if (someUser) {
    await anon.from('users').update({ first_name: 'RLS_TEST_ANON' }).eq('id', someUser.id);
    const { data: after } = await service.from('users').select('first_name').eq('id', someUser.id).maybeSingle();
    check('anon cannot update users', after?.first_name === someUser.first_name, `first_name is now ${after?.first_name}`);
  }
  const ins = await anon.from('analytics_events').insert({ event_type: 'rls_test', category: 'rls_test' });
  check('anon cannot insert analytics_events', !!ins.error, 'insert succeeded');
  const insEv = await anon.from('events').insert({ title: 'RLS_TEST', event_date: '2099-01-01' });
  check('anon cannot insert events', !!insEv.error, 'insert succeeded');
  const insC = await anon.from('announcement_comments').insert({ content: 'RLS_TEST', status: 'approved' });
  check('anon cannot insert announcement_comments', !!insC.error, 'insert succeeded');
}

// -----------------------------------------------------------------------------
// 2. Authenticated role (member A, member B, admin)
// -----------------------------------------------------------------------------
async function testAuthenticated() {
  console.log('\n--- AUTHENTICATED ROLE ---');
  if (!jwtSecret) {
    skip('authenticated-role tests', 'SUPABASE_JWT_SECRET not set (Dashboard > Project Settings > API > JWT secret)');
    return;
  }

  const { data: members } = await service.from('users').select('id, role, first_name, phone').eq('role', 'member').limit(2);
  const { data: admin } = await service.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
  if (!members || members.length < 2 || !admin) {
    skip('authenticated-role tests', 'need at least 2 members and 1 admin in public.users');
    return;
  }
  const [a, b] = members;
  const asA = clientFor(a.id);
  const asAdmin = clientFor(admin.id);

  // Sanity: the minted token is accepted at all (otherwise every "denied" below is meaningless).
  const sanity = await asA.from('users').select('id').eq('id', a.id);
  if (rowsOf(sanity).length !== 1) {
    check('minted JWT is accepted by Supabase (own user row readable)', false, sanity.error?.message ?? 'no row returned - wrong SUPABASE_JWT_SECRET / signing key?');
    return;
  }
  check('minted JWT is accepted by Supabase (own user row readable)', true);

  // users: row isolation + column hardening
  const allUsers = rowsOf(await asA.from('users').select('id'));
  check('member sees only their own users row', allUsers.length === 1 && allUsers[0].id === a.id, `${allUsers.length} rows`);
  check('member cannot read users.password_hash', !!(await asA.from('users').select('password_hash').eq('id', a.id)).error);
  const roleUp = await asA.from('users').update({ role: 'admin' }).eq('id', a.id).select();
  const { data: aAfter } = await service.from('users').select('role').eq('id', a.id).maybeSingle();
  check('member cannot promote themselves to admin', !!roleUp.error && aAfter?.role === 'member', `role is now ${aAfter?.role}`);
  const tierUp = await asA.from('users').update({ membership_tier: 'premium' }).eq('id', a.id).select();
  check('member cannot change own membership_tier', !!tierUp.error);
  await asA.from('users').update({ first_name: 'RLS_TEST_B' }).eq('id', b.id);
  const { data: bAfter } = await service.from('users').select('first_name').eq('id', b.id).maybeSingle();
  check("member cannot update another member's profile", bAfter?.first_name === b.first_name);
  const okUp = await asA.from('users').update({ first_name: a.first_name }).eq('id', a.id).select();
  check('member can update an allowed column on own row', !okUp.error && rowsOf(okUp).length === 1, okUp.error?.message);
  const adminUsers = rowsOf(await asAdmin.from('users').select('id'));
  check('admin (authenticated + role=admin) can read all users', adminUsers.length >= 2);

  // per-user tables: member A must never see member B's rows
  for (const t of ['notifications', 'notification_preferences', 'tier_upgrade_requests', 'event_registrations', 'announcement_poll_responses']) {
    const rows = rowsOf(await asA.from(t).select('user_id'));
    check(`member sees only own rows in ${t}`, rows.every((r) => r.user_id === a.id), `${rows.filter((r) => r.user_id !== a.id).length} foreign row(s)`);
  }
  const adminAn = await asAdmin.from('analytics_events').select('id').limit(1);
  const memberAn = rowsOf(await asA.from('analytics_events').select('id').limit(1));
  check('analytics_events readable by admin only', !adminAn.error && memberAn.length === 0);

  // payment methods: members only see active ones
  const pm = rowsOf(await asA.from('payment_methods').select('is_active'));
  check('member sees only active payment_methods', pm.every((r) => r.is_active === true));

  // writes
  const forged = await asA.from('announcement_comments').insert({ content: 'RLS_TEST', user_id: b.id, status: 'pending' });
  check('member cannot insert a comment as another user', !!forged.error);
  const selfApprove = await asA.from('announcement_comments').insert({ content: 'RLS_TEST', user_id: a.id, status: 'approved' });
  check('member cannot insert a pre-approved comment', !!selfApprove.error);
  const okIns = await asA.from('announcement_comments').insert({ content: 'RLS_TEST', user_id: a.id, status: 'pending' }).select('id');
  check('member can insert own pending comment', !okIns.error && rowsOf(okIns).length === 1, okIns.error?.message);
  await service.from('announcement_comments').delete().eq('content', 'RLS_TEST');

  const fakeTier = await asA.from('tier_upgrade_requests').insert({ user_id: a.id, current_tier: 'basic', requested_tier: 'premium', status: 'approved' });
  check('member cannot insert an already-approved tier request', !!fakeTier.error);
  const memberEvent = await asA.from('events').insert({ title: 'RLS_TEST', event_date: '2099-01-01' });
  check('member cannot create events', !!memberEvent.error);
  const memberBenefit = await asA.from('benefits').insert({ merchant_name: 'RLS_TEST', category: 'x', discount_description: 'x' });
  check('member cannot create benefits', !!memberBenefit.error);
  const forgedAnalytics = await asA.from('analytics_events').insert({ user_id: b.id, event_type: 'rls_test', category: 'rls_test' });
  check('member cannot insert analytics as another user', !!forgedAnalytics.error);
  await service.from('events').delete().eq('title', 'RLS_TEST');
  await service.from('benefits').delete().eq('merchant_name', 'RLS_TEST');
}

try {
  await testAnon();
  await testAuthenticated();
} catch (err) {
  console.error('Unexpected error:', err);
  failed++;
}

console.log(`\nSFR-05 DB-level RLS test: ${passed} passed, ${failed} failed, ${skipped} skipped`);
if (skipped) console.log('Skipped checks are NOT verified - resolve them before relying on this result.');
process.exit(failed ? 1 : 0);
