import { spawn } from 'child_process';

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
    console.log('Shutting down server...');
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
    throw new Error(`Login failed for ${email} with status ${res.status}`);
  }

  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`No Set-Cookie returned for ${email}`);
  }

  const tokenMatch = setCookie.match(/token=([^;]+)/);
  if (!tokenMatch) {
    throw new Error(`Token cookie not found in Set-Cookie for ${email}`);
  }

  return `token=${tokenMatch[1]}`;
}

// -----------------------------------------------------------------------------
// Suite 2: Server-Side Workflow Integrity & Non-Regression
// -----------------------------------------------------------------------------
async function testPortalWorkflows() {
  console.log('\n--- SUITE 2: Portal Member & Admin Workflows Integrity ---');

  // 1. Authenticate users
  let member1Cookie = '';
  let member2Cookie = '';
  let adminCookie = '';

  try {
    member1Cookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);
    record('AUTH', 'Member 1 login succeeds & receives token', true);
  } catch (err) {
    record('AUTH', 'Member 1 login succeeds & receives token', false, err.message);
  }

  try {
    member2Cookie = await loginUser(MEMBER2_CREDENTIALS.email, MEMBER2_CREDENTIALS.password);
    record('AUTH', 'Member 2 login succeeds & receives token', true);
  } catch (err) {
    record('AUTH', 'Member 2 login succeeds & receives token', false, err.message);
  }

  try {
    adminCookie = await loginUser(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    record('AUTH', 'Admin login succeeds & receives token', true);
  } catch (err) {
    record('AUTH', 'Admin login succeeds & receives token', false, err.message);
  }

  // 2. Member Portal Pages (SSR)
  const memberPages = [
    '/member',
    '/member/events',
    '/member/benefit',
    '/member/community',
    '/member/profile',
    '/member/settings',
    '/member/notifications',
  ];

  for (const page of memberPages) {
    const res = await fetch(`${BASE_URL}${page}`, {
      headers: { Cookie: member1Cookie },
      redirect: 'manual',
    });
    record('MEMBER-SSR', `Member page ${page} loads cleanly`, res.status === 200, `status=${res.status}`);
  }

  // 3. Member Portal APIs
  // (a) Notifications count
  const notifRes = await fetch(`${BASE_URL}/api/member/notifications`, {
    headers: { Cookie: member1Cookie },
  });
  const notifJson = await notifRes.json();
  record('MEMBER-API', 'Member gets notification count', notifRes.status === 200 && typeof notifJson.unreadCount === 'number');

  // (b) Tier upgrade status
  const tierRes = await fetch(`${BASE_URL}/api/member/tier-upgrade`, {
    headers: { Cookie: member1Cookie },
  });
  const tierJson = await tierRes.json();
  record('MEMBER-API', 'Member queries tier upgrade info', tierRes.status === 200 && Array.isArray(tierJson.requests));

  // (c) Member profile update (self-update)
  const profilePatchRes = await fetch(`${BASE_URL}/api/member/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: member1Cookie,
    },
    body: JSON.stringify({
      salutation: 'mr',
      first_name: 'Member1',
      last_name: 'UAT',
      phone: '+6581234567',
      organization: 'Pergas Test Org',
      designation: 'Student',
    }),
  });
  record('MEMBER-API', 'Member updates own profile successfully', profilePatchRes.status === 200, `status=${profilePatchRes.status}`);

  // 4. Admin Portal Workflows
  const adminEndpoints = [
    { url: '/api/admin/members', method: 'GET', desc: 'Member Directory' },
    { url: '/api/admin/dashboard', method: 'GET', desc: 'Dashboard Overview' },
    { url: '/api/admin/analytics', method: 'GET', desc: 'Engagement Analytics' },
    { url: '/api/admin/tier-requests', method: 'GET', desc: 'Tier Requests' },
    { url: '/api/admin/payment-methods', method: 'GET', desc: 'Payment Methods' },
    { url: '/api/admin/team', method: 'GET', desc: 'Admin Team' },
  ];

  for (const ep of adminEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: { Cookie: adminCookie },
    });
    record('ADMIN-API', `Admin accesses ${ep.desc} (${ep.url})`, res.status === 200, `status=${res.status}`);
  }
}

// -----------------------------------------------------------------------------
// Suite 3: Access Control & Security Boundaries
// -----------------------------------------------------------------------------
async function testSecurityBoundaries() {
  console.log('\n--- SUITE 3: Security Boundary & Unauthorized Rejection ---');

  // 1. Unauthenticated cannot access member APIs
  const unauthProfileRes = await fetch(`${BASE_URL}/api/member/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: 'Hacker' }),
  });
  record('SECURITY', 'Unauthenticated denied on member profile update (401)', unauthProfileRes.status === 401);

  const unauthNotifRes = await fetch(`${BASE_URL}/api/member/notifications`);
  record('SECURITY', 'Unauthenticated denied on member notifications (401)', unauthNotifRes.status === 401);

  const unauthTierRes = await fetch(`${BASE_URL}/api/member/tier-upgrade`);
  record('SECURITY', 'Unauthenticated denied on member tier upgrade (401)', unauthTierRes.status === 401);

  // 2. Member cannot access Admin APIs (Vertical Privilege Escalation Blocked)
  const member1Cookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);
  const adminEndpointsToTest = [
    '/api/admin/members',
    '/api/admin/dashboard',
    '/api/admin/analytics',
    '/api/admin/tier-requests',
    '/api/admin/payment-methods',
    '/api/admin/team',
  ];

  for (const url of adminEndpointsToTest) {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: { Cookie: member1Cookie },
    });
    record('SECURITY', `Member strictly rejected from ${url} (401)`, res.status === 401, `status=${res.status}`);
  }
}

// -----------------------------------------------------------------------------
// Main Runner
// -----------------------------------------------------------------------------
async function run() {
  try {

    await startServerIfNeeded();
    await testPortalWorkflows();
    await testSecurityBoundaries();

    console.log('\n======================================================');
    const total = testResults.length;
    const passed = testResults.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Phase 2 Test Summary: ${passed}/${total} PASSED (${failed} failed)`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
}

run();
