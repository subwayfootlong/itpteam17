import { test, expect, call } from "./support/fixtures";
import { ADMIN_ROUTES, MEMBER_ROUTES, ANY_USER_ROUTES, INTERNAL_ROUTES, type RouteCase } from "./support/routes";
import { userFor } from "./support/db";
import { signedSession, sessionCookie } from "./support/tokens";

// TC-SFR-01 API authorisation and role enforcement (test-cases.md)
test("TC-SFR-01 API authorisation and role enforcement", async ({ evidence, anonApi, apiAs, apiWithCookie }) => {
  test.setTimeout(180_000);
  const ev = evidence.start("TC-SFR-01", "API authorisation and role enforcement");

  async function expectStatus(step: string, ctx: Parameters<typeof call>[0], routes: RouteCase[], expected: number, headers?: Record<string, string>) {
    for (const route of routes) {
      const res = await call(ctx, route, {}, headers);
      const ok = res.status() === expected;
      ev.check(`${step}: ${route.method} ${route.path}`, String(expected), String(res.status()), ok);
      if (!ok) await ev.http(`${step}: ${route.method} ${route.path}`, route.method, route.path, res);
    }
  }

  // Step 1-2: no session at all.
  await expectStatus("1 anonymous -> admin", anonApi, ADMIN_ROUTES, 401);
  await expectStatus("2 anonymous -> member", anonApi, [...MEMBER_ROUTES, ...ANY_USER_ROUTES], 401);

  // Step 3: a logged-in member on admin routes.
  const member = await apiAs("memberA");
  await expectStatus("3 member -> admin", member, ADMIN_ROUTES, 403);

  // Step 4: an admin on member-only routes.
  const admin = await apiAs("admin");
  await expectStatus("4 admin -> member", admin, MEMBER_ROUTES, 403);

  // Step 5: internal worker endpoints without, and with a wrong, bearer secret.
  await expectStatus("5 internal, no secret", anonApi, INTERNAL_ROUTES, 401);
  await expectStatus("5 internal, wrong secret", anonApi, INTERNAL_ROUTES, 401, {
    Authorization: `Bearer ${"wrong-secret-".repeat(5)}`,
  });

  // Step 6: a correctly signed token for memberA that also claims role "admin".
  const a = await userFor("memberA");
  const forged = await apiWithCookie(sessionCookie(signedSession(a.id, a.email, { role: "admin" })));
  await expectStatus("6 member token claiming admin -> admin", forged, ADMIN_ROUTES, 403);

  expect(ev.passed, "all TC-SFR-01 checks pass").toBe(true);
});
