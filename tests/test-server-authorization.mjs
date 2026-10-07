import http from 'http';
import { spawn } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let serverProcess = null;

const MEMBER_CREDENTIALS = {
  email: 'member1@uat.pergas.org',
  password: 'Testing123!',
};

const ADMIN_CREDENTIALS = {
  email: 'admin2@uat.pergas.org',
  password: 'Testing123!',
};

const testResults = [];

function record(suite, testName, passed, details = '') {
  testResults.push({ suite, testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${suite}] ${testName}${details ? ` -> ${details}` : ''}`);
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
    console.log(`Server already running at ${BASE_URL}`);
    return;
  }

  console.log(`Starting production Next.js server on port 3000...`);
  // Use npm run start or next start
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
    console.log('Stopping server process...');
    serverProcess.kill('SIGTERM');
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${email}: status ${res.status}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`No Set-Cookie header returned for ${email}`);
  }

  // Extract token cookie
  const match = setCookie.match(/token=([^;]+)/);
  if (!match) {
    throw new Error(`Token cookie not found in set-cookie: ${setCookie}`);
  }

  return match[0]; // e.g. token=xxx
}

async function runTests() {
  console.log('====================================================');
  console.log('  SFR-05 Phase 1: Server-Side Authorization Tests  ');
  console.log('====================================================\n');

  try {
    await startServerIfNeeded();

    // -------------------------------------------------------------------------
    // SUITE 1: Unauthenticated Access Control (Must Reject with 401)
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 1: Unauthenticated Access Control (401 Expected) ---');

    const adminEndpoints = [
      { method: 'GET', url: '/api/admin/members' },
      { method: 'GET', url: '/api/admin/members/00000000-0000-0000-0000-000000000000' },
      { method: 'PATCH', url: '/api/admin/members/00000000-0000-0000-0000-000000000000', body: { first_name: 'Test' } },
      { method: 'GET', url: '/api/admin/dashboard' },
      { method: 'GET', url: '/api/admin/analytics' },
      { method: 'GET', url: '/api/admin/payment-methods' },
      { method: 'POST', url: '/api/admin/payment-methods', body: { name: 'Test Pay' } },
      { method: 'GET', url: '/api/admin/payment-methods/00000000-0000-0000-0000-000000000000' },
      { method: 'PATCH', url: '/api/admin/payment-methods/00000000-0000-0000-0000-000000000000', body: { name: 'Test' } },
      { method: 'DELETE', url: '/api/admin/payment-methods/00000000-0000-0000-0000-000000000000' },
      { method: 'GET', url: '/api/admin/team' },
      { method: 'POST', url: '/api/admin/upload' },
      { method: 'GET', url: '/api/admin/events/00000000-0000-0000-0000-000000000000/registrations' },
      { method: 'DELETE', url: '/api/admin/events/00000000-0000-0000-0000-000000000000/registrations' },
      { method: 'GET', url: '/api/admin/events' },
      { method: 'POST', url: '/api/admin/events', body: { title: 'Test' } },
      { method: 'GET', url: '/api/admin/announcements' },
      { method: 'POST', url: '/api/admin/announcements', body: { title: 'Test' } },
      { method: 'GET', url: '/api/admin/tier-requests' },
      { method: 'PATCH', url: '/api/admin/comment-moderation', body: { id: '00000000-0000-0000-0000-000000000000', source: 'discussion-post', action: 'approve' } },
      { method: 'GET', url: '/api/admin/discussion-groups' },
      { method: 'GET', url: '/api/admin/engagement' },
    ];

    for (const ep of adminEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });

      const passed = res.status === 401;
      record('Unauthenticated Guard', `${ep.method} ${ep.url}`, passed, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------------------
    // SUITE 2: Member Privilege Escalation (Member Token -> Admin Endpoints)
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 2: Member Privilege Escalation Prevention (401 Expected) ---');

    console.log(`Logging in member: ${MEMBER_CREDENTIALS.email}...`);
    const memberCookie = await login(MEMBER_CREDENTIALS.email, MEMBER_CREDENTIALS.password);
    record('Member Login', 'Authenticate member1@uat.pergas.org', true);

    for (const ep of adminEndpoints) {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          Cookie: memberCookie,
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });

      const passed = res.status === 401;
      record('Member Role Isolation', `Member blocked from ${ep.method} ${ep.url}`, passed, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------------------
    // SUITE 3: Admin Workflow Preservation (Admin Token -> Admin Endpoints 200 OK)
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 3: Legitimate Admin Workflows (200 OK Expected) ---');

    console.log(`Logging in admin: ${ADMIN_CREDENTIALS.email}...`);
    const adminCookie = await login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    record('Admin Login', 'Authenticate admin2@uat.pergas.org', true);

    const adminReadEndpoints = [
      { name: 'Dashboard stats & feed', url: '/api/admin/dashboard', check: (d) => Boolean(d.stats) },
      { name: 'Members directory', url: '/api/admin/members', check: (d) => Array.isArray(d.members) },
      { name: 'Analytics metrics', url: '/api/admin/analytics', check: (d) => Boolean(d.kpi) },
      { name: 'Events directory', url: '/api/admin/events', check: (d) => Array.isArray(d.events) },
      { name: 'Announcements directory', url: '/api/admin/announcements', check: (d) => Array.isArray(d.announcements) },
      { name: 'Tier requests queue', url: '/api/admin/tier-requests', check: (d) => Array.isArray(d.requests) },
      { name: 'Payment methods list', url: '/api/admin/payment-methods', check: (d) => Array.isArray(d.paymentMethods) },
      { name: 'Team members directory', url: '/api/admin/team', check: (d) => Array.isArray(d.members) },
      { name: 'Discussion groups config', url: '/api/admin/discussion-groups', check: (d) => Array.isArray(d.groups) },
      { name: 'Engagement benefits list', url: '/api/admin/engagement', check: (d) => Array.isArray(d.benefits) },
    ];

    for (const item of adminReadEndpoints) {
      const res = await fetch(`${BASE_URL}${item.url}`, {
        method: 'GET',
        headers: { Cookie: adminCookie },
      });

      if (!res.ok) {
        record('Admin Workflow', item.name, false, `Status ${res.status}`);
      } else {
        const data = await res.json();
        const valid = item.check(data);
        record('Admin Workflow', item.name, valid, valid ? `200 OK (Data validated)` : `200 OK (Unexpected payload structure)`);
      }
    }

    // -------------------------------------------------------------------------
    // SUITE 4: Legitimate Member Workflows Preservation (200 OK Expected)
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 4: Legitimate Member Workflows (200 OK Expected) ---');

    const memberEndpoints = [
      { name: 'Member Notifications API', url: '/api/member/notifications', check: (d) => typeof d.unreadCount === 'number' },
      { name: 'Notification Preferences API', url: '/api/member/notification-preferences', check: (d) => Boolean(d.preferences) },
      { name: 'Tier Upgrade Info API', url: '/api/member/tier-upgrade', check: (d) => Boolean(d.currentTier) },
    ];

    for (const item of memberEndpoints) {
      const res = await fetch(`${BASE_URL}${item.url}`, {
        method: 'GET',
        headers: { Cookie: memberCookie },
      });

      if (!res.ok) {
        record('Member Workflow', item.name, false, `Status ${res.status}`);
      } else {
        const data = await res.json();
        const valid = item.check(data);
        record('Member Workflow', item.name, valid, valid ? `200 OK (Data validated)` : `200 OK (Unexpected payload)`);
      }
    }

    // Also test member portal page navigations with member session
    const memberPages = [
      { name: 'Member Home Dashboard', url: '/member' },
      { name: 'Member Events Page', url: '/member/events' },
      { name: 'Member Benefits Page', url: '/member/benefit' },
      { name: 'Member Community Page', url: '/member/community' },
      { name: 'Member Profile Page', url: '/member/profile' },
    ];

    for (const page of memberPages) {
      const res = await fetch(`${BASE_URL}${page.url}`, {
        method: 'GET',
        headers: { Cookie: memberCookie },
      });
      const passed = res.status === 200;
      record('Member Portal Navigation', page.name, passed, `Status: ${res.status}`);
    }

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n====================================================');
    console.log('                 TEST SUMMARY                       ');
    console.log('====================================================');
    const total = testResults.length;
    const passed = testResults.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Checks: ${total}`);
    console.log(`Passed:       ${passed}`);
    console.log(`Failed:       ${failed}`);

    if (failed > 0) {
      console.error(`\n❌ ${failed} test(s) failed.`);
      process.exitCode = 1;
    } else {
      console.log(`\n🎉 All ${total} tests passed! Phase 1 server-side authorization is fully verified.`);
    }

  } catch (err) {
    console.error('Fatal error running tests:', err);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
}

runTests();
