const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const { pgcrypto } = require('@electric-sql/pglite/contrib/pgcrypto');
const { NextRequest, NextResponse } = require('next/server');

// Execute application code with explicit dependencies. Never load live DB credentials.
function load(file, dependencies) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, process: { env: { NODE_ENV: 'production' } }, URL, Response,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: file });
  return exports;
}

const policy = load('lib/sessionPolicy.ts', {});
const session = load('lib/session.ts', {
  'next/server': { NextResponse }, './sessionPolicy': policy,
});
const origin = load('lib/requestSecurity.ts', {});

test('merged proxy enforces API origins before any page-session validation', async () => {
  let validations = 0;
  const { proxy, config } = load('proxy.ts', {
    'next/server': { NextResponse }, '@/lib/session': session,
    '@/lib/requestSecurity': origin,
    '@/lib/sessionServer': { validateSession: async () => { validations++; return null; } },
    '@/lib/serverErrors': { logServerError() {} },
  });
  assert.ok(config.matcher.includes('/api/:path*'));
  for (const pathname of ['/api/auth/login', '/api/auth/logout', '/api/member/change-password']) {
    for (const supplied of [undefined, 'https://attacker.example']) {
      const response = await proxy(new NextRequest(`https://app.example${pathname}`, {
        method: 'POST', headers: supplied ? { Origin: supplied } : {},
      }));
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    assert.equal((await proxy(new NextRequest(`https://app.example${pathname}`, {
      method: 'POST', headers: { Origin: 'https://app.example' },
    }))).headers.get('x-middleware-next'), '1');
  }
  assert.equal(validations, 0); // Route guards authenticate APIs; login stays reachable.
});

test('merged proxy accepts valid DB sessions and fails closed on revoked sessions or DB errors', async () => {
  for (const outcome of ['valid', 'revoked', 'failure']) {
    let logged = false;
    const { proxy } = load('proxy.ts', {
      'next/server': { NextResponse }, '@/lib/session': session,
      '@/lib/requestSecurity': origin,
      '@/lib/sessionServer': { validateSession: async () => {
        if (outcome === 'failure') throw new Error('private database details');
        return outcome === 'valid' ? { sub: 'member' } : null;
      } },
      '@/lib/serverErrors': { logServerError() { logged = true; } },
    });
    const response = await proxy(new NextRequest('https://app.example/member', {
      headers: { Cookie: 'token=test; last_activity=9999999999999' },
    }));
    assert.equal(response.status, outcome === 'valid' ? 200 : 307);
    if (outcome !== 'valid') {
      assert.equal(response.cookies.get('token').value, '');
      assert.equal(response.cookies.get('last_activity').value, '');
      assert.equal(response.headers.get('location'), 'https://app.example/?screen=login');
    }
    assert.equal(logged, outcome === 'failure');
  }
});

test('session SQL enforces expiry, revocation, credential invalidation and restricted grants locally', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create table users(id uuid primary key, email text, password_hash text, role text);
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, '../docs/supabase-session-security-migration.sql'), 'utf8'));
    const user = randomUUID(), email = 'member@example.com';
    await db.query('insert into users values ($1,$2,$3,$4)', [user, email, 'old-hash', 'member']);
    const scalar = async (sql, args) => (await db.query(sql, args)).rows[0].ok;
    const create = async (hash = 'old-hash') => {
      const sid = randomUUID();
      assert.equal(await scalar('select auth_session_create($1,$2,$3,$4) as ok', [user, email, hash, sid]), true);
      return sid;
    };
    const valid = sid => scalar('select auth_session_validate($1,$2,$3) as ok', [user, sid, email]);
    const first = await create(), second = await create();
    assert.equal(await valid(first), true);
    await db.query('select auth_session_revoke($1,$2)', [user, first]);
    assert.equal(await valid(first), false);
    assert.equal(await valid(second), true);
    await db.query(`update auth_sessions set created_at=now()-interval '1 hour',
      expires_at=now()-interval '1 hour'+interval '7 days',
      last_activity_at=now()-interval '15 minutes' where id=$1`, [second]);
    assert.equal(await valid(second), false);
    const third = await create(), fourth = await create();
    assert.equal(await scalar('select auth_session_change_password($1,$2,$3,$4,$5) as ok',
      [user, third, email, 'old-hash', 'new-hash']), true);
    assert.equal(await valid(third), false);
    assert.equal(await valid(fourth), false);
    assert.equal(await scalar('select auth_session_create($1,$2,$3,$4) as ok',
      [user, email, 'old-hash', randomUUID()]), false);
    const fifth = await create('new-hash');
    await db.query('update users set email=$1 where id=$2', ['changed@example.com', user]);
    assert.equal(await valid(fifth), false);
    for (const role of ['anon', 'authenticated']) {
      assert.equal(await scalar("select has_table_privilege($1,'auth_sessions','SELECT') as ok", [role]), false);
      assert.equal(await scalar("select has_function_privilege($1,'auth_session_validate(uuid,uuid,text)','EXECUTE') as ok", [role]), false);
    }
  } finally {
    await db.close();
  }
});

test('SFR-05 and session migrations coexist with real local RLS enforcement', async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    // Minimal schema fixture for policy dependencies, not a production schema clone.
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      create table users(id uuid primary key, email text, password_hash text, role text,
        created_at timestamptz, member_id text, membership_tier text, membership_status text,
        expiry_date date, phone text, arabic_name text, member_since date, first_name text,
        last_name text, organization text, designation text, salutation text, ars_status text,
        profile_image_url text);
    `);
    const tables = ['events', 'event_registrations', 'benefits', 'announcements',
      'announcement_comments', 'announcement_poll_responses', 'discussion_groups',
      'discussion', 'discussion_comments', 'notifications', 'notification_preferences',
      'tier_upgrade_requests', 'analytics_events', 'payment_methods',
      'email_change_requests', 'email_change_limits', 'email_change_notifications',
      'email_outbox', 'announcement_email_publications'];
    for (const table of tables) {
      await db.exec(`create table ${table}(id uuid primary key, user_id uuid,
        status text, audience_type text, is_active boolean)`);
    }
    await db.exec('grant all on all tables in schema public to anon, authenticated, service_role');
    const migration = name => fs.readFileSync(path.join(__dirname, '../docs', name), 'utf8');
    await db.exec(migration('supabase-sfr05-rls.sql'));
    await db.exec(migration('supabase-session-security-migration.sql'));
    // Reapplying main's idempotent migration must not reopen the session table.
    await db.exec(migration('supabase-sfr05-rls.sql'));
    const member = randomUUID(), other = randomUUID(), admin = randomUUID();
    await db.query(`insert into users(id,email,password_hash,role) values
      ($1,'a@example.com','hash','member'),($2,'b@example.com','hash','member'),
      ($3,'admin@example.com','hash','admin')`, [member, other, admin]);
    await db.query(`insert into events(id,status,audience_type) values
      ($1,'published','all'),($2,'draft','all'),($3,'published','restricted')`,
    [randomUUID(), randomUUID(), randomUUID()]);
    await db.exec('set role anon');
    assert.equal((await db.query('select id from events')).rows.length, 1);
    await assert.rejects(db.query('select id from users'), /permission denied/);
    await assert.rejects(db.query('select * from auth_sessions'), /permission denied/);
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
    await db.exec('set role authenticated');
    assert.deepEqual((await db.query('select id from users')).rows, [{ id: member }]);
    await assert.rejects(db.query('select password_hash from users'), /permission denied/);
    await assert.rejects(db.query("update users set role='admin' where id=$1", [member]), /permission denied/);
    assert.equal((await db.query("update users set first_name='safe' where id=$1 returning id", [other])).rows.length, 0);
    assert.equal((await db.query("update users set first_name='safe' where id=$1 returning id", [member])).rows.length, 1);
    await assert.rejects(db.query("insert into announcement_comments(id,user_id,status) values($1,$2,'approved')",
      [randomUUID(), member]), /row-level security/);
    await assert.rejects(db.query('select auth_session_validate($1,$2,$3)',
      [member, randomUUID(), 'a@example.com']), /permission denied/);
    for (const table of tables.slice(-5)) {
      await assert.rejects(db.query(`select * from ${table}`), /permission denied/);
    }
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select id from users')).rows.length, 3);
    await db.exec('reset role');
    assert.equal((await db.query("select relrowsecurity from pg_class where oid='auth_sessions'::regclass")).rows[0].relrowsecurity, true);
  } finally {
    await db.close();
  }
});
