import { request as playwrightRequest } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { ACCOUNTS, uatPassword } from "./support/accounts";
import { db, userFor } from "./support/db";
import { signedSession, expiredSession, wrongSecretSession, unsignedSession, tamperSignature, sessionCookie } from "./support/tokens";

// TC-SFR-06 Secure session and cross-site request handling (test-cases.md)
const PREFS = "/api/member/notification-preferences";

test("TC-SFR-06 secure session and cross-site request handling", async ({ evidence, apiAs, apiWithCookie, browser, baseURL }) => {
  test.setTimeout(120_000);
  const ev = evidence.start("TC-SFR-06", "Secure session and cross-site request handling");
  const a = await userFor("memberA");
  const member = await apiAs("memberA");
  const original = (await (await member.get(PREFS)).json()).preferences as Record<string, boolean>;
  const body = { benefit: !original.benefit };

  async function patchWith(step: string, cookie: string, expected: number, headers: Record<string, string> = {}) {
    const ctx = await apiWithCookie(cookie, headers);
    const res = await ctx.patch(PREFS, { data: body });
    await ev.http(step, "PATCH", PREFS, res, body);
    ev.check(step, String(expected), String(res.status()), res.status() === expected);
    return res;
  }

  try {
    const valid = signedSession(a.id, a.email);

    // Steps 1-3: altered, forged, unsigned and expired tokens.
    await patchWith("1 token with altered signature", sessionCookie(tamperSignature(valid)), 401);
    await patchWith("2 token signed with a different secret", sessionCookie(wrongSecretSession(a.id, a.email)), 401);
    await patchWith("2 unsigned token (alg: none)", sessionCookie(unsignedSession(a.id, a.email)), 401);
    await patchWith("3 correctly signed but expired token", sessionCookie(expiredSession(a.id, a.email)), 401);

    // Step 4: valid token, but idle longer than the 15-minute timeout.
    const idle = await patchWith("4 valid token idle for 16 minutes", sessionCookie(valid, Date.now() - 16 * 60 * 1000), 401);
    const cleared = (idle.headers()["set-cookie"] ?? "").includes("token=;");
    ev.check("4 idle session cookies cleared", "token cookie cleared", cleared ? "cleared" : "not cleared", cleared);

    // Step 5: log out, then reuse the old token.
    const session = await playwrightRequest.newContext({ baseURL });
    await session.post("/api/auth/login", { data: { email: ACCOUNTS.memberA, password: uatPassword() } });
    const token = (await session.storageState()).cookies.find((c) => c.name === "token")?.value ?? "";
    const logout = await session.post("/api/auth/logout");
    ev.check("5 logout succeeds", "200", String(logout.status()), logout.status() === 200);
    await session.dispose();
    await patchWith("5 token reused after logout", sessionCookie(token), 401);

    // Step 6: valid session, request claims to come from another site.
    await patchWith("6 valid session with Origin: https://evil.example", sessionCookie(valid), 403, { Origin: "https://evil.example" });

    // Step 7: SameSite on the session cookie.
    const login = await (await playwrightRequest.newContext({ baseURL })).post("/api/auth/login", {
      data: { email: ACCOUNTS.memberA, password: uatPassword() },
    });
    const tokenCookie = login.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value).find((v) => v.startsWith("token="));
    const sameSite = /;\s*samesite=(lax|strict)/i.exec(tokenCookie ?? "")?.[1];
    ev.check("7 session cookie sets SameSite explicitly", "SameSite=Lax or Strict", sameSite ? `SameSite=${sameSite}` : "no SameSite attribute", !!sameSite);

    // Step 8: a page on another site (127.0.0.1) makes the browser send cross-site POSTs to the portal (localhost).
    const portal = new URL(baseURL!);
    const otherSite = `${portal.protocol}//127.0.0.1:${portal.port}`;
    const context = await browser.newContext();
    await context.request.post(`${baseURL}/api/auth/login`, { data: { email: ACCOUNTS.memberA, password: uatPassword() } });
    const page = await context.newPage();
    const start = new Date().toISOString();
    await page.goto(`${otherSite}/`);
    // 8a: script fetch with credentials and a text/plain body (no CORS preflight).
    const fetchStatus = await page.evaluate(async (url) => {
      try {
        const r = await fetch(url, { method: "POST", mode: "no-cors", credentials: "include", headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ eventType: "event_view", category: "event", targetId: "csrf-test-fetch" }) });
        return r.type;
      } catch (e) {
        return String(e);
      }
    }, `${baseURL}/api/analytics/track`);
    // 8b: auto-submitted HTML form (top-level navigation) whose text/plain body is valid JSON.
    await page.setContent(`
      <form id="f" method="POST" action="${baseURL}/api/analytics/track" enctype="text/plain">
        <input name='{"eventType":"event_view","category":"event","targetId":"csrf-test-form","pad":"' value='x"}'>
      </form>`);
    await Promise.all([page.waitForLoadState("load").catch(() => {}), page.evaluate(() => (document.getElementById("f") as HTMLFormElement).submit())]);
    await page.waitForTimeout(1500);
    const { data: rows } = await db().from("analytics_events").select("target_id").eq("user_id", a.id).in("target_id", ["csrf-test-fetch", "csrf-test-form"]).gte("created_at", start);
    const landed = (rows ?? []).map((r) => r.target_id);
    ev.check("8a cross-site fetch carried the session", "no state change", landed.includes("csrf-test-fetch") ? "ANALYTICS ROW CREATED as memberA" : `no state change (${fetchStatus})`, !landed.includes("csrf-test-fetch"));
    ev.check("8b cross-site form POST carried the session", "no state change", landed.includes("csrf-test-form") ? "ANALYTICS ROW CREATED as memberA" : "no state change", !landed.includes("csrf-test-form"));

    // 8c (control): the identical form submitted from the portal's own site DOES change state,
    // proving 8b would have detected a successful cross-site request.
    await page.goto(`${baseURL}/member`);
    await page.setContent(`
      <form id="f" method="POST" action="${baseURL}/api/analytics/track" enctype="text/plain">
        <input name='{"eventType":"event_view","category":"event","targetId":"csrf-test-same-site","pad":"' value='x"}'>
      </form>`);
    await Promise.all([page.waitForLoadState("load").catch(() => {}), page.evaluate(() => (document.getElementById("f") as HTMLFormElement).submit())]);
    await page.waitForTimeout(1500);
    const { count: control } = await db().from("analytics_events").select("id", { count: "exact", head: true }).eq("user_id", a.id).eq("target_id", "csrf-test-same-site").gte("created_at", start);
    ev.check("8c control: same form from the portal's own site", "state changes (test can detect a successful request)", control ? "analytics row created" : "NO row created (test cannot detect CSRF)", !!control);
    await context.close();

    // Step 9 (control): the same request with a valid session works.
    await patchWith("9 valid session (control)", sessionCookie(valid), 200);
  } finally {
    await member.patch(PREFS, { data: { benefit: original.benefit } });
    await db().from("analytics_events").delete().eq("user_id", a.id).in("target_id", ["csrf-test-fetch", "csrf-test-form", "csrf-test-same-site"]);
  }

  expect(ev.passed, "all TC-SFR-06 checks pass").toBe(true);
});
