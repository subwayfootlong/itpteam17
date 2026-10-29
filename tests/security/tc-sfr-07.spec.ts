import jwt from "jsonwebtoken";
import { test, expect, waitForText } from "./support/fixtures";
import { userFor } from "./support/db";
import { signedSession, tamperPayload, tamperSignature } from "./support/tokens";

// TC-SFR-07 Secure digital membership verification (test-cases.md)
test("TC-SFR-07 secure digital membership verification", async ({ evidence, apiAs, anonApi, page }) => {
  test.setTimeout(120_000);
  const ev = evidence.start("TC-SFR-07", "Secure digital membership verification");
  const a = await userFor("memberA");
  const b = await userFor("memberB");
  const qrSecret = process.env.MEMBERSHIP_QR_SECRET;
  if (!qrSecret) throw new Error("MEMBERSHIP_QR_SECRET is required in .env.local");
  const member = await apiAs("memberA");

  // Step 1: issue a QR and inspect the token.
  const issued = await member.get("/api/member/qr-token");
  await ev.http("1 GET qr-token", "GET", "/api/member/qr-token", issued);
  const { verificationUrl } = await issued.json();
  const token = new URL(verificationUrl).searchParams.get("token") ?? "";
  const decoded = jwt.decode(token, { complete: true });
  const payload = (decoded?.payload ?? {}) as Record<string, unknown>;
  const keys = Object.keys(payload).sort().join(", ");
  ev.check("1 token is signed HS256", "alg = HS256", `alg = ${decoded?.header.alg}`, decoded?.header.alg === "HS256");
  ev.check("1 payload holds only the needed fields", "exp, iat, memberId, purpose", keys, keys === "exp, iat, memberId, purpose");
  const lifetime = Number(payload.exp) - Number(payload.iat);
  ev.check("1 token lifetime", "300 seconds", `${lifetime} seconds`, lifetime === 300);

  const verify = (t: string) => anonApi.get(`/api/verify/member?token=${encodeURIComponent(t)}`);

  // Step 2: verify the genuine token.
  const ok = await verify(token);
  await ev.http("2 verify genuine token", "GET", "/api/verify/member", ok);
  const okBody = await ok.json();
  const memberKeys = Object.keys(okBody.member ?? {}).sort().join(", ");
  ev.check("2 genuine token verifies", "valid: true", `valid: ${okBody.valid}`, okBody.valid === true);
  ev.check("2 response holds only display fields", "displayName, expiryDate, membershipStatus, membershipTier", memberKeys, memberKeys === "displayName, expiryDate, membershipStatus, membershipTier");
  const expectedName = `${(a.first_name ?? "Member").trim().split(/\s+/)[0]} ${(a.last_name ?? "").trim().charAt(0)}.`;
  ev.check("2 display name is first name + last initial", expectedName, String(okBody.member?.displayName), okBody.member?.displayName === expectedName);

  async function expectInvalid(step: string, t: string, code: "invalid" | "expired") {
    const res = await verify(t);
    const body = await res.json();
    await ev.http(step, "GET", "/api/verify/member", res);
    ev.check(step, `valid: false, code: ${code}`, `valid: ${body.valid}, code: ${body.code}`, body.valid === false && body.code === code);
  }

  // Steps 3-4: tampering.
  await expectInvalid("3 payload changed to memberB's id", tamperPayload(token, { memberId: b.id }), "invalid");
  await expectInvalid("4 signature altered", tamperSignature(token), "invalid");

  // Step 5: correctly signed but expired.
  const now = Math.floor(Date.now() / 1000);
  const expired = jwt.sign({ memberId: a.id, purpose: "membership-verification", iat: now - 600, exp: now - 300 }, qrSecret, { algorithm: "HS256" });
  await expectInvalid("5 expired QR", expired, "expired");

  // Step 6: wrong secret, wrong purpose, and a session token presented as a QR.
  await expectInvalid("6 signed with a different secret", jwt.sign({ memberId: a.id, purpose: "membership-verification" }, "x".repeat(48), { algorithm: "HS256", expiresIn: 300 }), "invalid");
  await expectInvalid("6 wrong purpose", jwt.sign({ memberId: a.id, purpose: "password-reset" }, qrSecret, { algorithm: "HS256", expiresIn: 300 }), "invalid");
  await expectInvalid("6 member's session token used as a QR", signedSession(a.id, a.email), "invalid");

  // Step 7: response headers that keep the QR out of caches and referrers.
  for (const [label, res] of [["qr-token", issued], ["verify", ok]] as const) {
    const h = res.headers();
    const good = /no-store/.test(h["cache-control"] ?? "") && h["referrer-policy"] === "no-referrer";
    ev.check(`7 ${label} response headers`, "Cache-Control: no-store; Referrer-Policy: no-referrer", `Cache-Control: ${h["cache-control"]}; Referrer-Policy: ${h["referrer-policy"]}`, good);
  }

  // Step 8: the public verify page, as a third party with no session.
  const fresh = new URL((await (await member.get("/api/member/qr-token")).json()).verificationUrl);
  await page.goto(`${fresh.pathname}${fresh.search}`);
  const cardShown = await waitForText(page, expectedName);
  ev.check("8 verify page shows the member card for a genuine QR", `shows "${expectedName}"`, cardShown ? "member card shown" : "member card NOT shown", cardShown);
  await ev.screenshot(page, "verify page genuine QR");
  await page.goto(`/verify/member?token=${encodeURIComponent(tamperSignature(token))}`);
  const rejected = await waitForText(page, "Invalid Membership QR");
  ev.check("8 verify page rejects a tampered QR", 'shows "Invalid Membership QR"', rejected ? "rejected" : "NOT rejected", rejected);
  await ev.screenshot(page, "verify page tampered QR");

  expect(ev.passed, "all TC-SFR-07 checks pass").toBe(true);
});
