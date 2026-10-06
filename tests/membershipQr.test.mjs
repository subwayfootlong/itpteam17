import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const jwt = require("jsonwebtoken");
process.env.JWT_SECRET = "test-login-secret-".repeat(4);
process.env.MEMBERSHIP_QR_SECRET = "test-qr-secret-".repeat(4);
process.env.APP_URL = "https://pergas.example";
let cookieValues, record, dbError, queries;
const mocks = {
  "next/headers": { cookies: async () => ({ get: (key) => cookieValues[key] ? { value: cookieValues[key] } : undefined }) },
  "@/lib/supabaseServer": { supabaseAdmin: { from(table) {
    const query = { table };
    queries.push(query);
    return {
      select(fields) { query.fields = fields; return this; },
      eq(key, value) { query.key = key; query.value = value; return this; },
      async maybeSingle() { return { data: record && record[query.key] === query.value ? record : null, error: dbError }; },
    };
  } } },
};
const cache = new Map();
function load(file) {
  const filename = resolve(file);
  if (cache.has(filename)) return cache.get(filename);
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule.exports);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const localRequire = (id) => {
    if (mocks[id]) return mocks[id];
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
    if (id.startsWith(".")) return load(resolve(dirname(filename), `${id}.ts`));
    return require(id);
  };
  vm.runInThisContext(`(function(require, module, exports) {${compiled}\n})`, { filename })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const qr = load("lib/membershipQr.ts");
const issue = load("app/api/member/qr-token/route.ts").GET;
const verify = load("app/api/verify/member/route.ts").GET;
const verifyRequest = (token = "") => verify(new Request(`https://pergas.example/api/verify/member?token=${encodeURIComponent(token)}`));
const issueRequest = () => issue(new Request("https://untrusted.example/api/member/qr-token?memberId=OTHER"));

beforeEach(() => {
  record = { id: "user-1", member_id: "PGS-001", first_name: "Liando", last_name: "Anderson", membership_tier: "ordinary", membership_status: "active", expiry_date: "2099-12-31", email: "private@example.com", phone: "private", password_hash: "secret", address: "private", nric: "private" };
  cookieValues = { token: jwt.sign({ sub: "user-1" }, process.env.JWT_SECRET, { expiresIn: 300 }) };
  dbError = null;
  queries = [];
});

test("QR-SEC-01 authenticated issuance and public verification; browser member ID ignored", async () => {
  const response = await issueRequest();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  const body = await response.json();
  assert.equal(body.expiresIn, 300);
  const url = new URL(body.verificationUrl);
  assert.equal(url.origin, "https://pergas.example");
  assert.equal(queries[0].value, "user-1");
  cookieValues = {};
  const verified = await verifyRequest(url.searchParams.get("token"));
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).member.membershipStatus, "active");
});

test("QR-SEC-02 modified token is rejected without a database lookup", async () => {
  const parts = qr.generateMembershipQrToken(record.id).split(".");
  parts[2] = (parts[2][0] === "A" ? "B" : "A") + parts[2].slice(1);
  assert.equal((await (await verifyRequest(parts.join("."))).json()).code, "invalid");
  assert.equal(queries.length, 0);
});

test("existing accounts without a membership number can generate and verify their QR", async () => {
  record.member_id = null;
  const issued = await issueRequest();
  assert.equal(issued.status, 200);
  const { verificationUrl } = await issued.json();
  const token = new URL(verificationUrl).searchParams.get("token");
  assert.equal(jwt.decode(token).memberId, record.id);
  const verified = await verifyRequest(token);
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).member.membershipStatus, "active");
  assert.equal(queries[0].fields, "id");
  assert.equal(queries[1].key, "id");
});

test("a phone-based membership number is never embedded in an issued token", async () => {
  record.member_id = "+6591234567";
  const { verificationUrl } = await (await issueRequest()).json();
  const token = new URL(verificationUrl).searchParams.get("token");
  const payload = jwt.decode(token);
  assert.equal(payload.memberId, record.id);
  assert.ok(!JSON.stringify(payload).includes(record.member_id));
  record.member_id = "+6597654321";
  assert.equal((await verifyRequest(token)).status, 200);
});

test("QR-SEC-03 expired token is rejected", async () => {
  const token = jwt.sign({ memberId: record.id, purpose: "membership-verification", iat: Math.floor(Date.now() / 1000) - 301 }, process.env.MEMBERSHIP_QR_SECRET, { expiresIn: 300 });
  assert.equal((await (await verifyRequest(token)).json()).code, "expired");
  assert.equal(queries.length, 0);
});

test("QR-SEC-04 token and response expose only approved fields", async () => {
  const token = qr.generateMembershipQrToken(record.id);
  const payload = jwt.decode(token);
  assert.deepEqual(Object.keys(payload).sort(), ["exp", "iat", "memberId", "purpose"]);
  assert.equal(payload.exp - payload.iat, 300);
  const response = await verifyRequest(token);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(await response.json(), { valid: true, member: { displayName: "Liando A.", membershipTier: "ordinary", membershipStatus: "active", expiryDate: "2099-12-31" } });
  assert.equal(queries[0].fields, "first_name, last_name, membership_tier, membership_status, expiry_date");
});

test("QR-SEC-05 same QR reflects changed database status and tier", async () => {
  const token = qr.generateMembershipQrToken(record.id);
  assert.equal((await (await verifyRequest(token)).json()).member.membershipStatus, "active");
  record.membership_status = "suspended";
  record.membership_tier = "basic";
  const updated = await (await verifyRequest(token)).json();
  assert.equal(updated.member.membershipStatus, "suspended");
  assert.equal(updated.member.membershipTier, "basic");
  assert.equal(queries.length, 2);
});

test("QR-SEC-06 missing, invalid, expired and idle sessions cannot issue QR", async () => {
  for (const cookies of [{}, { token: "fake" }, { token: jwt.sign({ sub: "user-1" }, process.env.JWT_SECRET, { expiresIn: -1 }) }, { ...cookieValues, last_activity: String(Date.now() - 16 * 60 * 1000) }]) {
    cookieValues = cookies;
    assert.equal((await issueRequest()).status, 401);
  }
  assert.equal(queries.length, 0);
});

test("missing, malformed, wrong-purpose, wrong-algorithm and non-expiring tokens are rejected", async () => {
  const payload = { memberId: record.id, purpose: "membership-verification" };
  for (const token of ["", "malformed", jwt.sign({ ...payload, purpose: "login" }, process.env.MEMBERSHIP_QR_SECRET, { expiresIn: 300 }), jwt.sign(payload, process.env.MEMBERSHIP_QR_SECRET, { algorithm: "HS384", expiresIn: 300 }), jwt.sign(payload, process.env.MEMBERSHIP_QR_SECRET)]) {
    assert.equal((await (await verifyRequest(token)).json()).code, "invalid");
  }
  assert.equal(queries.length, 0);
});

test("missing members and database failures return controlled errors", async () => {
  const token = qr.generateMembershipQrToken(record.id);
  record = null;
  assert.equal((await verifyRequest(token)).status, 404);
  assert.equal((await issueRequest()).status, 404);
  dbError = { message: "sensitive database internals" };
  for (const response of [await verifyRequest(token), await issueRequest()]) {
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /sensitive|internals/);
  }
});
