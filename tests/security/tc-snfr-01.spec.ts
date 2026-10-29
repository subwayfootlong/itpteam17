import fs from "node:fs";
import path from "node:path";
import { request as playwrightRequest, type APIResponse } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { ACCOUNTS, uatPassword } from "./support/accounts";
import { db } from "./support/db";
import { decode } from "./support/tokens";

// TC-SNFR-01 Secure session configuration (test-cases.md)
// Must run against a production build (next start), where production cookie settings apply.
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function cookiesOf(res: APIResponse) {
  return res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value);
}

function flags(cookie: string | undefined) {
  const c = cookie ?? "";
  return {
    httpOnly: /;\s*httponly/i.test(c),
    secure: /;\s*secure/i.test(c),
    sameSite: /;\s*samesite=(lax|strict)/i.exec(c)?.[1] ?? null,
    path: /;\s*path=\//i.test(c),
    maxAge: Number(/;\s*max-age=(\d+)/i.exec(c)?.[1] ?? NaN),
  };
}

test("TC-SNFR-01 secure session configuration", async ({ evidence, baseURL }) => {
  const ev = evidence.start("TC-SNFR-01", "Secure session configuration");
  const ctx = await playwrightRequest.newContext({ baseURL });
  const throwawayEmail = `security-test-${Date.now()}@uat.pergas.org`;

  function checkCookie(step: string, cookie: string | undefined, needMaxAge: boolean) {
    const f = flags(cookie);
    const missing = [!f.httpOnly && "HttpOnly", !f.secure && "Secure", !f.sameSite && "SameSite", !f.path && "Path=/", needMaxAge && !(f.maxAge > 0) && "Max-Age"].filter(Boolean);
    ev.check(step, `HttpOnly; Secure; SameSite=Lax|Strict; Path=/${needMaxAge ? "; Max-Age" : ""}`,
      cookie ? (missing.length ? `missing: ${missing.join(", ")}` : `all set (SameSite=${f.sameSite}, Max-Age=${f.maxAge})`) : "cookie not set",
      !!cookie && missing.length === 0);
  }

  try {
    // Steps 1-2: login cookies.
    const login = await ctx.post("/api/auth/login", { data: { email: ACCOUNTS.memberA, password: uatPassword() } });
    await ev.http("1 login", "POST", "/api/auth/login", login);
    const loginCookies = cookiesOf(login);
    const tokenCookie = loginCookies.find((c) => c.startsWith("token="));
    checkCookie("1 login: token cookie", tokenCookie, true);
    checkCookie("2 login: last_activity cookie", loginCookies.find((c) => c.startsWith("last_activity=")), true);

    // Step 3: registration and logout cookies (throwaway account, deleted below).
    const reg = await ctx.post("/api/auth/register", {
      data: {
        email: throwawayEmail, password: "Security-Test-Pass-1", salutation: "mr", firstName: "Security", lastName: "Test",
        organization: "Security test", designation: "Test", arsStatus: "no", phone: "+65 8100 0099",
      },
    });
    await ev.http("3 register", "POST", "/api/auth/register", reg);
    ev.check("3 throwaway registration succeeds", "200", String(reg.status()), reg.status() === 200);
    checkCookie("3 register: token cookie", cookiesOf(reg).find((c) => c.startsWith("token=")), true);
    const logout = await ctx.post("/api/auth/logout");
    await ev.http("3 logout", "POST", "/api/auth/logout", logout);
    const logoutToken = cookiesOf(logout).find((c) => c.startsWith("token="));
    const lf = flags(logoutToken);
    ev.check("3 logout clears token with matching attributes", "Max-Age=0; HttpOnly; Secure; SameSite",
      logoutToken ? `Max-Age=${lf.maxAge}; ${[lf.httpOnly && "HttpOnly", lf.secure && "Secure", lf.sameSite && `SameSite=${lf.sameSite}`].filter(Boolean).join("; ") || "no flags"}` : "not cleared",
      !!logoutToken && lf.maxAge === 0 && lf.httpOnly && lf.secure && !!lf.sameSite);

    // Step 4: token lifetime.
    const token = /^token=([^;]+)/.exec(tokenCookie ?? "")?.[1] ?? "";
    const payload = (decode(token)?.payload ?? {}) as { iat?: number; exp?: number };
    const lifetime = (payload.exp ?? 0) - (payload.iat ?? 0);
    ev.check("4 token has an expiry of 7 days", `${SEVEN_DAYS} s`, payload.exp ? `${lifetime} s` : "no exp claim", lifetime === SEVEN_DAYS);
    ev.check("4 cookie Max-Age matches token lifetime", `${lifetime} s`, `${flags(tokenCookie).maxAge} s`, flags(tokenCookie).maxAge === lifetime);

    // Step 5 (inspection): session lifetime and idle timeout documented.
    const docs = ["README.md", "docs/setup.md", "docs/project-overview.md", "docs/workflow.md"]
      .map((f) => path.join(process.cwd(), f))
      .filter((f) => fs.existsSync(f))
      .map((f) => ({ f: path.relative(process.cwd(), f), text: fs.readFileSync(f, "utf8") }));
    const lifetimeDoc = docs.find((d) => /session[^.\n]{0,80}(7 days|seven days|7d)|(7 days|seven days)[^.\n]{0,80}session/i.test(d.text));
    const idleDoc = docs.find((d) => /(15 minutes|15-minute|fifteen minutes)[^.\n]{0,80}(idle|inactiv)|(idle|inactiv)[^.\n]{0,80}(15 minutes|15-minute)/i.test(d.text));
    ev.check("5 session lifetime (7 days) documented", "documented", lifetimeDoc ? `in ${lifetimeDoc.f}` : `not found in ${docs.map((d) => d.f).join(", ")}`, !!lifetimeDoc);
    ev.check("5 idle timeout (15 minutes) documented", "documented", idleDoc ? `in ${idleDoc.f}` : `not found in ${docs.map((d) => d.f).join(", ")}`, !!idleDoc);
  } finally {
    await db().from("users").delete().eq("email", throwawayEmail);
    await ctx.dispose();
  }

  expect(ev.passed, "all TC-SNFR-01 checks pass").toBe(true);
});
