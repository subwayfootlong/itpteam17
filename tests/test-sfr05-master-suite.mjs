/**
 * SFR-05: Master Database Access Control & Security Verification Suite
 * 
 * Verifies all three acceptance criteria of SFR-05:
 *   1. Row-Level Security (RLS) enabled on all tables
 *   2. Policies written and tested per table (cross-tenant isolation & privilege escalation defense)
 *   3. Service-role key is used only server-side and only where needed
 *   4. Full workflow non-regression for both Member and Admin portals
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let serverProcess = null;

const MEMBER1_CREDENTIALS = {
  email: 'member1@uat.pergas.org',
  password: 'Testing123!',
};

const MEMBER2_CREDENTIALS = {
  email: 'member2@uat.pergas.org',
  password: 'Testing123!',
};

const ADMIN_CREDENTIALS = {
  email: 'admin1@uat.pergas.org',
  password: 'Testing123!',
};

const results = [];

function record(category, checkName, passed, detail = '') {
  results.push({ category, checkName, passed, detail });
  const badge = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${badge} [${category}] ${checkName}${detail ? ` -> ${detail}` : ''}`);
}

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/`, { method: 'HEAD' });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await isServerRunning()) {
    console.log(`Server already active on ${BASE_URL}`);
    return;
  }

  console.log(`Launching production Next.js server on port 3000...`);
  serverProcess = spawn('npx', ['next', 'start', '-p', '3000'], {
    shell: true,
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerRunning()) {
      console.log(`Server is ready!`);
      return;
    }
  }

  throw new Error('Failed to start server within 30 seconds');
}

function stopServer() {
  if (serverProcess) {
    console.log('Stopping test server process...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t']);
    } else {
      serverProcess.kill('SIGTERM');
    }
  }
}

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${email} with HTTP ${res.status}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`No Set-Cookie returned for ${email}`);
  }

  const match = setCookie.match(/token=([^;]+)/);
  if (!match) {
    throw new Error(`Token cookie not found in response for ${email}`);
  }

  return `token=${match[1]}`;
}

// =============================================================================
// CATEGORY 1: Database Access Control & RLS Policy Matrix
// =============================================================================
function verifyDatabaseRlsCoverage() {
  console.log('\n======================================================');
  console.log(' CATEGORY 1: PostgreSQL Row-Level Security Matrix     ');
  console.log('======================================================');

  const sqlPath = path.join(process.cwd(), 'docs', 'supabase-sfr05-rls.sql');
  const exists = fs.existsSync(sqlPath);
  record('RLS-MATRIX', 'docs/supabase-sfr05-rls.sql master migration exists', exists);
  if (!exists) return;

  const content = fs.readFileSync(sqlPath, 'utf8');

  // Security Definer helper check
  const hasAdminHelper =
    content.includes('CREATE OR REPLACE FUNCTION public.is_admin()') &&
    content.includes('SECURITY DEFINER') &&
    content.includes('STABLE');
  record('RLS-MATRIX', 'public.is_admin() helper defined with SECURITY DEFINER and STABLE', hasAdminHelper);

  const tables = [
    'users',
    'events',
    'event_registrations',
    'benefits',
    'announcements',
    'announcement_comments',
    'announcement_poll_responses',
    'discussion_groups',
    'discussion',
    'discussion_comments',
    'notifications',
    'notification_preferences',
    'tier_upgrade_requests',
    'analytics_events',
    'payment_methods',
  ];

  for (const table of tables) {
    const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+public\\.${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    record('RLS-MATRIX', `Table public.${table} RLS enabled`, rlsRegex.test(content));

    const policyRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+public\\.${table}`, 'i');
    record('RLS-MATRIX', `Table public.${table} policies defined`, policyRegex.test(content));
  }

  const legacyTables = [
    'uc6_announcements',
    'uc6_announcement_comments',
    'uc6_discussion_groups',
    'uc6_discussion_threads',
    'uc6_thread_comments',
  ];
  for (const table of legacyTables) {
    record('RLS-MATRIX', `Legacy table public.${table} RLS guarded`, content.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
  }
}

// =============================================================================
// CATEGORY 2: Service-Role Key Minimization & Defense-in-Depth
// =============================================================================
function verifyServiceRoleMinimization() {
  console.log('\n======================================================');
  console.log(' CATEGORY 2: Service-Role Key Confinement & Auditing  ');
  console.log('======================================================');

  // 1. Check env files
  const envExample = fs.readFileSync(path.join(process.cwd(), '.env.local.example'), 'utf8');
  record('SERVICE-ROLE', 'Service-role key not exposed as NEXT_PUBLIC_ in env', !envExample.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'));

  // 2. Check UI components directory
  const componentsDir = path.join(process.cwd(), 'components');
  let leakedInUI = false;
  function scan(dir) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, item.name);
      if (item.isDirectory()) scan(p);
      else if (item.isFile() && /\.(tsx|jsx|ts|js)$/.test(item.name)) {
        const text = fs.readFileSync(p, 'utf8');
        if (text.includes('supabaseAdmin') || text.includes('SUPABASE_SERVICE_ROLE_KEY')) {
          leakedInUI = true;
        }
      }
    }
  }
  if (fs.existsSync(componentsDir)) scan(componentsDir);
  record('SERVICE-ROLE', 'Zero service-role or supabaseAdmin references in UI components/', !leakedInUI);

  // 3. Runtime server-only check in lib/supabaseServer.ts
  const serverCode = fs.readFileSync(path.join(process.cwd(), 'lib', 'supabaseServer.ts'), 'utf8');
  record('SERVICE-ROLE', 'lib/supabaseServer.ts enforces runtime window check', serverCode.includes("typeof window !== 'undefined'"));
}

// =============================================================================
// CATEGORY 3: Server-Side Authorization Lockdown (All Admin Endpoints)
// =============================================================================
async function verifyServerSideAuthorization() {
  console.log('\n======================================================');
  console.log(' CATEGORY 3: Server-Side Authorization & Role Guarding');
  console.log('======================================================');

  const memberCookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);
  const adminCookie = await loginUser(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);

  const endpoints = [
    { method: 'GET', url: '/api/admin/members', name: 'Member Directory' },
    { method: 'GET', url: '/api/admin/members/00000000-0000-0000-0000-000000000000', name: 'Member Detail' },
    { method: 'PATCH', url: '/api/admin/members/00000000-0000-0000-0000-000000000000', name: 'Member Update' },
    { method: 'GET', url: '/api/admin/dashboard', name: 'Dashboard Stats' },
    { method: 'GET', url: '/api/admin/analytics', name: 'Analytics Aggregation' },
    { method: 'GET', url: '/api/admin/payment-methods', name: 'Payment Methods List' },
    { method: 'POST', url: '/api/admin/payment-methods', name: 'Payment Methods Create' },
    { method: 'GET', url: '/api/admin/payment-methods/00000000-0000-0000-0000-000000000000', name: 'Payment Method Detail' },
    { method: 'PATCH', url: '/api/admin/payment-methods/00000000-0000-0000-0000-000000000000', name: 'Payment Method Update' },
    { method: 'DELETE', url: '/api/admin/payment-methods/00000000-0000-0000-0000-000000000000', name: 'Payment Method Delete' },
    { method: 'GET', url: '/api/admin/team', name: 'Team List' },
    { method: 'POST', url: '/api/admin/upload', name: 'Storage Upload' },
    { method: 'GET', url: '/api/admin/events/00000000-0000-0000-0000-000000000000/registrations', name: 'Event Registrations' },
    { method: 'DELETE', url: '/api/admin/events/00000000-0000-0000-0000-000000000000/registrations', name: 'Registration Cancel' },
    { method: 'GET', url: '/api/admin/events', name: 'Events Admin List' },
    { method: 'POST', url: '/api/admin/events', name: 'Event Admin Create' },
    { method: 'GET', url: '/api/admin/announcements', name: 'Announcements Admin List' },
    { method: 'POST', url: '/api/admin/announcements', name: 'Announcement Admin Create' },
    { method: 'GET', url: '/api/admin/tier-requests', name: 'Tier Requests Admin List' },
    { method: 'PATCH', url: '/api/admin/comment-moderation', name: 'Comment Moderation' },
    { method: 'GET', url: '/api/admin/discussion-groups', name: 'Discussion Groups Admin' },
    { method: 'GET', url: '/api/admin/engagement', name: 'Engagement Benefits Admin' },
  ];

  for (const ep of endpoints) {
    // 1. Unauthenticated test (401 expected)
    const unauthRes = await fetch(`${BASE_URL}${ep.url}`, { method: ep.method });
    record('AUTH-GUARD', `Unauthenticated rejected from ${ep.name} (401)`, unauthRes.status === 401, `status=${unauthRes.status}`);

    // 2. Member test (401 expected)
    const memberRes = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: { Cookie: memberCookie },
    });
    record('AUTH-GUARD', `Member role rejected from ${ep.name} (401)`, memberRes.status === 401, `status=${memberRes.status}`);
  }
}

// =============================================================================
// CATEGORY 4: Cross-Tenant Data Isolation & Horizontal Protection
// =============================================================================
async function verifyCrossTenantDataIsolation() {
  console.log('\n======================================================');
  console.log(' CATEGORY 4: Cross-Tenant Data Isolation & Tamper Test');
  console.log('======================================================');

  const member1Cookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);
  const member2Cookie = await loginUser(MEMBER2_CREDENTIALS.email, MEMBER2_CREDENTIALS.password);

  // Read Member 2's profile
  const m2Res = await fetch(`${BASE_URL}/api/member/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: member2Cookie },
    body: JSON.stringify({
      salutation: 'mr',
      first_name: 'Member2',
      last_name: 'UAT',
      phone: '+6582345678',
      organization: 'Pergas Test Org 2',
      designation: 'Educator',
    }),
  });
  const m2Json = await m2Res.json();
  const m2UserId = m2Json?.member?.id;
  record('ISOLATION', 'Member 2 identity confirmed', !!m2UserId);

  // Member 1 attempts to tamper with Member 2 by injecting member 2 id into request
  const spoofRes = await fetch(`${BASE_URL}/api/member/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
    body: JSON.stringify({
      id: m2UserId,
      user_id: m2UserId,
      salutation: 'mr',
      first_name: 'AttackerInjectedName',
      last_name: 'Hacked',
      phone: '+6581234567',
      organization: 'Attacker Org',
      designation: 'Attacker',
    }),
  });
  const spoofJson = await spoofRes.json();
  record('ISOLATION', 'Member 1 update scoped strictly to Member 1 self-id', spoofJson?.member?.id !== m2UserId);

  // Verify Member 2's name was never modified
  const verifyM2 = await (
    await fetch(`${BASE_URL}/member/profile`, {
      headers: { Cookie: member2Cookie },
    })
  ).text();
  record('ISOLATION', 'Member 2 record untampered across horizontal boundaries', !verifyM2.includes('AttackerInjectedName'));

  // Reset Member 1 profile
  await fetch(`${BASE_URL}/api/member/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
    body: JSON.stringify({
      salutation: 'mr',
      first_name: 'Member1',
      last_name: 'UAT',
      phone: '+6581234567',
      organization: 'Pergas Test Org',
      designation: 'Student',
    }),
  });
}

// =============================================================================
// CATEGORY 5: Full Portal Workflow Continuity (Member & Admin)
// =============================================================================
async function verifyPortalWorkflows() {
  console.log('\n======================================================');
  console.log(' CATEGORY 5: Portal Workflows End-to-End Continuity   ');
  console.log('======================================================');

  const memberCookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);
  const adminCookie = await loginUser(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);

  // Member SSR Pages
  const memberPages = [
    { url: '/member', name: 'Member Home Dashboard' },
    { url: '/member/events', name: 'Events Rail & Directory' },
    { url: '/member/benefit', name: 'Perks & Benefits Directory' },
    { url: '/member/community', name: 'Community Discussions' },
    { url: '/member/profile', name: 'Member Pass & Profile' },
    { url: '/member/settings', name: 'Member Settings' },
    { url: '/member/notifications', name: 'Notifications Hub' },
  ];

  for (const page of memberPages) {
    const res = await fetch(`${BASE_URL}${page.url}`, {
      headers: { Cookie: memberCookie },
      redirect: 'manual',
    });
    record('WORKFLOW-MEMBER', `${page.name} loads cleanly (200 OK)`, res.status === 200, `status=${res.status}`);
  }

  // Member API Operations
  const notifCountRes = await fetch(`${BASE_URL}/api/member/notifications`, {
    headers: { Cookie: memberCookie },
  });
  record('WORKFLOW-MEMBER', 'Member Notifications API operational', notifCountRes.status === 200);

  const tierInfoRes = await fetch(`${BASE_URL}/api/member/tier-upgrade`, {
    headers: { Cookie: memberCookie },
  });
  record('WORKFLOW-MEMBER', 'Member Tier Upgrade Query operational', tierInfoRes.status === 200);

  // Admin Workflows
  const adminOps = [
    { url: '/api/admin/members', name: 'Admin Member Directory' },
    { url: '/api/admin/dashboard', name: 'Admin Dashboard Stats' },
    { url: '/api/admin/analytics', name: 'Admin Analytics Metrics' },
    { url: '/api/admin/tier-requests', name: 'Admin Tier Requests Queue' },
    { url: '/api/admin/payment-methods', name: 'Admin Payment Methods List' },
    { url: '/api/admin/team', name: 'Admin Team Directory' },
    { url: '/api/admin/events', name: 'Admin Events Directory' },
    { url: '/api/admin/announcements', name: 'Admin Announcements Directory' },
    { url: '/api/admin/engagement', name: 'Admin Engagement Directory' },
  ];

  for (const op of adminOps) {
    const res = await fetch(`${BASE_URL}${op.url}`, {
      headers: { Cookie: adminCookie },
    });
    record('WORKFLOW-ADMIN', `${op.name} operational (200 OK)`, res.status === 200, `status=${res.status}`);
  }
}

// =============================================================================
// Runner
// =============================================================================
async function runMasterSuite() {
  console.log('======================================================');
  console.log(' SFR-05: DATABASE ACCESS CONTROL MASTER VERIFICATION  ');
  console.log('======================================================');

  try {
    verifyDatabaseRlsCoverage();
    verifyServiceRoleMinimization();

    await startServerIfNeeded();
    await verifyServerSideAuthorization();
    await verifyCrossTenantDataIsolation();
    await verifyPortalWorkflows();

    console.log('\n======================================================');
    console.log('                 FINAL TEST REPORT                    ');
    console.log('======================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Checks:   ${total}`);
    console.log(`Passed:         ${passed}`);
    console.log(`Failed:         ${failed}`);
    console.log('======================================================');

    if (failed > 0) {
      console.error(`\n❌ SFR-05 Master Suite encountered ${failed} failure(s).`);
      process.exitCode = 1;
    } else {
      console.log('\n🎉 ALL SFR-05 SECURITY REQUIREMENTS FULLY SATISFIED!');
    }
  } catch (err) {
    console.error('\nFatal test runner error:', err);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
}

runMasterSuite();
