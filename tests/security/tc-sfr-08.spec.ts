import { createHmac, randomUUID } from "node:crypto";
import { test, expect } from "./support/fixtures";
import { uatPassword } from "./support/accounts";
import { db, must, userFor } from "./support/db";

// TC-SFR-08 Secure email address change (test-cases.md)
// SMTP is not configured, so the server cannot email a real code. Steps 7-10 put
// the pending request in the database with a known code, hashed exactly as the
// server does (HMAC-SHA256 with EMAIL_CHANGE_SECRET over "<id>:<otp>"), which is
// what the server stores before it sends the email.
test("TC-SFR-08 secure email address change", async ({ evidence, apiAs, baseURL }) => {
  test.setTimeout(120_000);
  const ev = evidence.start("TC-SFR-08", "Secure email address change");
  const secret = process.env.EMAIL_CHANGE_SECRET;
  if (!secret || secret.length < 32) throw new Error("EMAIL_CHANGE_SECRET (32+ chars) is required in .env.local");
  const c = await userFor("memberC");
  const a = await userFor("memberA");
  const origin = { Origin: new URL(baseURL!).origin };
  const NEW_EMAIL = "member5+security-test@uat.pergas.org";
  const OTP = "482915";

  const resetState = async () => {
    await db().from("email_change_requests").delete().eq("user_id", c.id);
    await db().from("email_change_limits").delete().eq("user_id", c.id);
  };
  const putPending = async (expiresInMs: number) => {
    const id = randomUUID();
    must(
      await db().from("email_change_requests").upsert({
        user_id: c.id, id, old_email: c.email, new_email: NEW_EMAIL,
        otp_hash: createHmac("sha256", secret).update(`${id}:${OTP}`).digest("hex"),
        expires_at: new Date(Date.now() + expiresInMs).toISOString(), attempt_count: 0, verified_at: null,
      }),
      "create pending email change",
    );
    return id;
  };
  const emailNow = async () => (await db().from("users").select("email").eq("id", c.id).single()).data?.email;

  await resetState();
  let pendingId = "";
  try {
    const api = await apiAs("memberC");
    const req = (data: unknown, headers: Record<string, string> = origin) =>
      api.post("/api/member/email-change/request", { data, headers });
    const verify = (otp: string) => api.post("/api/member/email-change/verify", { data: { otp }, headers: origin });
    const record = async (step: string, res: Awaited<ReturnType<typeof req>>, expected: number, body?: unknown) => {
      const text = await res.text();
      await ev.http(step, "POST", res.url().replace(baseURL!, ""), res, body);
      let msg = "";
      try { msg = JSON.parse(text).error ?? JSON.parse(text).message ?? ""; } catch { msg = text.slice(0, 80); }
      ev.check(step, String(expected), `${res.status()} "${msg}"`, res.status() === expected);
    };

    // Step 1: re-authentication is required.
    await record("1 no current password", await req({ newEmail: NEW_EMAIL }), 401, { newEmail: NEW_EMAIL });
    await record("1 wrong current password", await req({ newEmail: NEW_EMAIL, currentPassword: "WrongPassword!1" }), 401);
    const { count: created } = await db().from("email_change_requests").select("user_id", { count: "exact", head: true }).eq("user_id", c.id);
    ev.check("1 no request created after failed re-authentication", "0 pending requests", `${created} pending request(s)`, created === 0);

    // Step 2: format.
    await record("2 invalid email format", await req({ newEmail: "not-an-email", currentPassword: uatPassword() }), 400);

    // Step 3: uniqueness (memberA's address).
    await record("3 email already used by another account", await req({ newEmail: a.email, currentPassword: uatPassword() }), 409);

    // Step 4: needs SMTP.
    ev.skip("4 valid request sends the code to the new email", "SMTP_PASSWORD not configured; the server cannot send email");

    // Step 5: Origin check.
    await record("5 no Origin header", await req({ newEmail: NEW_EMAIL, currentPassword: uatPassword() }, {}), 403);
    await record("5 foreign Origin", await req({ newEmail: NEW_EMAIL, currentPassword: uatPassword() }, { Origin: "https://evil.example" }), 403);

    // Step 6: members only.
    const admin = await apiAs("admin");
    await record("6 admin account", await admin.post("/api/member/email-change/request", { data: { newEmail: NEW_EMAIL, currentPassword: uatPassword() }, headers: origin }), 403);

    // Step 7: wrong code.
    pendingId = await putPending(10 * 60_000);
    await record("7 wrong code", await verify("000000"), 400);
    ev.check("7 email not changed", c.email, String(await emailNow()), (await emailNow()) === c.email);

    // Step 8: five wrong codes lock the request, even for the right code afterwards.
    for (let i = 0; i < 4; i++) await verify(String(100000 + i));
    await record("8 correct code after 5 wrong attempts", await verify(OTP), 429);
    ev.check("8 email not changed", c.email, String(await emailNow()), (await emailNow()) === c.email);

    // Step 9: expired request.
    pendingId = await putPending(-60_000);
    await record("9 correct code after expiry", await verify(OTP), 400);
    ev.check("9 email not changed", c.email, String(await emailNow()), (await emailNow()) === c.email);

    // Step 10: correct code in time completes the change, ends the session and queues the old-email notice.
    pendingId = await putPending(10 * 60_000);
    const done = await verify(OTP);
    await record("10 correct code within the time limit", done, 200);
    const after = await emailNow();
    ev.check("10 email changed", NEW_EMAIL, String(after), after === NEW_EMAIL);
    const setCookie = done.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value).join(" | ");
    ev.check("10 session ended", "token cookie cleared", /token=;/.test(setCookie) ? "token cookie cleared" : "token cookie NOT cleared", /token=;/.test(setCookie));
    const { data: notice } = await db().from("email_change_notifications").select("old_email, new_email").eq("id", pendingId).maybeSingle();
    ev.check("10 old-email notice queued", `to ${c.email}`, notice ? `to ${notice.old_email}` : "NOT queued", notice?.old_email === c.email);

    // Step 11: needs SMTP.
    ev.skip("11 old email receives the change notice", "SMTP_PASSWORD not configured; the notice is queued (step 10) but cannot be delivered");
  } finally {
    // Restore memberC's email and remove everything this test created.
    if ((await emailNow()) !== c.email) await db().from("users").update({ email: c.email }).eq("id", c.id);
    await db().from("email_change_notifications").delete().eq("new_email", NEW_EMAIL);
    await resetState();
  }
  ev.check("cleanup: memberC's email restored", c.email, String(await emailNow()), (await emailNow()) === c.email);

  expect(ev.passed, "all TC-SFR-08 checks pass").toBe(true);
});
