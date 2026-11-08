import { test, expect } from "./support/fixtures";
import { ACCOUNTS } from "./support/accounts";

// TC-00: precondition check. Proves the harness itself works (server reachable,
// accounts log in, evidence and screenshots are written) before the real test
// cases are trusted. Not one of the SFR/SNFR test cases.
test("TC-00 test harness and accounts are ready", async ({ evidence, anonApi, apiAs, pageAs }) => {
  const ev = evidence.start("TC-00", "Test harness and accounts are ready");

  const anon = await anonApi.get("/api/member/notifications");
  await ev.http("Anonymous request to a member API", "GET", "/api/member/notifications", anon);
  ev.check("Anonymous call to member API", "401", String(anon.status()), anon.status() === 401);

  for (const role of ["memberA", "memberB", "memberC", "admin"] as const) {
    let ok = false;
    let actual = "";
    try {
      await apiAs(role);
      ok = true;
      actual = "logged in";
    } catch (err) {
      actual = (err as Error).message;
    }
    ev.check(`Log in as ${role} (${ACCOUNTS[role]})`, "logged in", actual, ok);
  }

  const memberApi = await apiAs("memberA");
  const own = await memberApi.get("/api/member/notifications");
  ev.check("Logged-in member calls a member API", "200", String(own.status()), own.status() === 200);

  const page = await pageAs("memberA");
  await page.goto("/member");
  const onPortal = new URL(page.url()).pathname.startsWith("/member");
  ev.check("Logged-in member opens /member in the browser", "stays on /member", new URL(page.url()).pathname, onPortal);
  await ev.screenshot(page, "member home as memberA");

  expect(ev.passed, "all harness checks pass").toBe(true);
});
