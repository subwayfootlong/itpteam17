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
// Suite 1: Service-Role Confinement & Client Bundle Leak Prevention
// -----------------------------------------------------------------------------
function testServiceRoleConfinement() {
  console.log('\n--- SUITE 1: Service-Role Key Confinement & Architecture Auditing ---');

  // Check 1: No NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY in .env files or codebase
  const envExample = fs.readFileSync(path.join(process.cwd(), '.env.local.example'), 'utf8');
  const envExposed = envExample.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  record('CONFINEMENT', 'No public exposure of service role key in env example', !envExposed);

  // Check 2: components/ directory must not import supabaseAdmin or supabaseServer
  const componentsDir = path.join(process.cwd(), 'components');
  let leakedInComponents = false;

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(tsx|jsx|ts|js)$/.test(entry.name)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        if (
          fileContent.includes('SUPABASE_SERVICE_ROLE_KEY') ||
          fileContent.includes('supabaseAdmin') ||
          fileContent.includes('@/lib/supabaseServer')
        ) {
          leakedInComponents = true;
          console.error(`Leaked in component: ${fullPath}`);
        }
      }
    }
  }

  if (fs.existsSync(componentsDir)) {
    scanDir(componentsDir);
  }
  record('CONFINEMENT', 'Zero service-role or supabaseAdmin references in UI components/', !leakedInComponents);

  // Check 3: lib/supabaseServer.ts runtime client guard
  const serverClientPath = path.join(process.cwd(), 'lib', 'supabaseServer.ts');
  const serverClientContent = fs.readFileSync(serverClientPath, 'utf8');
  const hasWindowGuard = serverClientContent.includes("typeof window !== 'undefined'");
  record('CONFINEMENT', 'supabaseServer.ts contains active browser-execution guard', hasWindowGuard);
}

// -----------------------------------------------------------------------------
// Suite 2: Horizontal Privilege Escalation & Cross-User Isolation
// -----------------------------------------------------------------------------
async function testCrossUserIsolation() {
  console.log('\n--- SUITE 2: Cross-User Data Isolation (Horizontal Privilege Check) ---');

  const member1Cookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);
  const member2Cookie = await loginUser(MEMBER2_CREDENTIALS.email, MEMBER2_CREDENTIALS.password);

  // Get initial Member 2 profile details via Member 2's own session
  const m2ProfileBefore = await (
    await fetch(`${BASE_URL}/api/member/profile`, {
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
    })
  ).json();

  record('ISOLATION', 'Member 2 initial profile verified', !!m2ProfileBefore?.member);

  // Member 1 attempts to forge an update with spoofed id/target in payload
  const m1SpoofAttempt = await fetch(`${BASE_URL}/api/member/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: member1Cookie },
    body: JSON.stringify({
      id: m2ProfileBefore?.member?.id,
      user_id: m2ProfileBefore?.member?.id,
      salutation: 'mr',
      first_name: 'HackedByMember1',
      last_name: 'Spoofed',
      phone: '+6581112222',
      organization: 'Attacker Org',
      designation: 'Attacker',
    }),
  });

  const m1SpoofJson = await m1SpoofAttempt.json();
  // Member 1's own record was updated, NOT Member 2!
  const member1OwnId = m1SpoofJson?.member?.id;
  const isMember1Updated = member1OwnId !== m2ProfileBefore?.member?.id;
  record('ISOLATION', 'Member 1 cannot modify Member 2 profile via spoofed id payload', isMember1Updated);

  // Verify Member 2's name was NOT changed by Member 1's action
  const m2Check = await (
    await fetch(`${BASE_URL}/member/profile`, {
      headers: { Cookie: member2Cookie },
    })
  ).text();

  const m2Untouched = !m2Check.includes('HackedByMember1');
  record('ISOLATION', 'Member 2 data remains pristine and untampered', m2Untouched);

  // Re-normalize Member 1 profile
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

// -----------------------------------------------------------------------------
// Suite 3: Privileged Operation Confinement & Workflow Integrity
// -----------------------------------------------------------------------------
async function testPrivilegedOperationConfinement() {
  console.log('\n--- SUITE 3: Privileged Operations Role Confinement ---');

  const adminCookie = await loginUser(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
  const member1Cookie = await loginUser(MEMBER1_CREDENTIALS.email, MEMBER1_CREDENTIALS.password);

  // Admin operations succeed
  const adminEndpoints = [
    { url: '/api/admin/members', method: 'GET', desc: 'Member Directory' },
    { url: '/api/admin/dashboard', method: 'GET', desc: 'Admin Dashboard' },
    { url: '/api/admin/analytics', method: 'GET', desc: 'System Analytics' },
    { url: '/api/admin/tier-requests', method: 'GET', desc: 'Tier Requests' },
    { url: '/api/admin/payment-methods', method: 'GET', desc: 'Payment Methods' },
    { url: '/api/admin/team', method: 'GET', desc: 'Admin Team' },
  ];

  for (const ep of adminEndpoints) {
    // Admin access
    const adminRes = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: { Cookie: adminCookie },
    });
    record('PRIVILEGE-ADMIN', `Admin authorized on ${ep.desc}`, adminRes.status === 200, `status=${adminRes.status}`);

    // Member access strictly blocked
    const memberRes = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: { Cookie: member1Cookie },
    });
    record('PRIVILEGE-MEMBER', `Member blocked from ${ep.desc} (401)`, memberRes.status === 401, `status=${memberRes.status}`);

    // Unauthenticated strictly blocked
    const unauthRes = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
    });
    record('PRIVILEGE-UNAUTH', `Unauthenticated blocked from ${ep.desc} (401)`, unauthRes.status === 401, `status=${unauthRes.status}`);
  }

  // Member Portal Workflows succeed
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
    record('MEMBER-WORKFLOW', `Member navigates to ${page}`, res.status === 200, `status=${res.status}`);
  }
}

// -----------------------------------------------------------------------------
// Main Runner
// -----------------------------------------------------------------------------
async function run() {
  try {
    testServiceRoleConfinement();

    await startServerIfNeeded();
    await testCrossUserIsolation();
    await testPrivilegedOperationConfinement();

    console.log('\n======================================================');
    const total = testResults.length;
    const passed = testResults.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Phase 3 Test Summary: ${passed}/${total} PASSED (${failed} failed)`);
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
