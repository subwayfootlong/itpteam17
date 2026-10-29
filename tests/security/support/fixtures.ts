import { test as base, expect, request as playwrightRequest, type APIRequestContext, type Page } from "@playwright/test";
import { ACCOUNTS, uatPassword, type AccountRole } from "./accounts";
import { Evidence } from "./evidence";
import type { RouteCase } from "./routes";

type SecurityFixtures = {
  /** Evidence recorder for the current test. Call `evidence.start(id, title)` first. */
  evidence: EvidenceHandle;
  /** API client with no session (anonymous caller). */
  anonApi: APIRequestContext;
  /** Returns an API client logged in as the given UAT account. */
  apiAs: (role: AccountRole) => Promise<APIRequestContext>;
  /** Returns a browser page logged in as the given UAT account. */
  pageAs: (role: AccountRole) => Promise<Page>;
  /** Returns an API client that sends exactly this Cookie header (for forged/expired sessions). */
  apiWithCookie: (cookie: string, extraHeaders?: Record<string, string>) => Promise<APIRequestContext>;
};

type EvidenceHandle = {
  start: (testCaseId: string, title: string) => Evidence;
  current: () => Evidence;
};

// Fixture callbacks are named `provide` rather than Playwright's usual `use`,
// so the React hooks lint rule doesn't mistake them for React's use().
export const test = base.extend<SecurityFixtures>({
  evidence: async ({}, provide) => {
    const holder: { ev?: Evidence } = {};
    const runId = process.env.SECURITY_RUN_ID ?? "local";
    await provide({
      start: (id, title) => (holder.ev = new Evidence(id, title, runId)),
      current: () => {
        if (!holder.ev) throw new Error("Call evidence.start(id, title) before recording evidence.");
        return holder.ev;
      },
    });
    // Always write, including when an assertion failed, so failures have evidence too.
    holder.ev?.write();
  },

  anonApi: async ({ baseURL }, provide) => {
    const ctx = await playwrightRequest.newContext({ baseURL });
    await provide(ctx);
    await ctx.dispose();
  },

  apiAs: async ({ baseURL }, provide) => {
    const contexts: APIRequestContext[] = [];
    await provide(async (role) => {
      const ctx = await playwrightRequest.newContext({ baseURL });
      await login(ctx, role);
      contexts.push(ctx);
      return ctx;
    });
    await Promise.all(contexts.map((c) => c.dispose()));
  },

  apiWithCookie: async ({ baseURL }, provide) => {
    const contexts: APIRequestContext[] = [];
    await provide(async (cookie, extraHeaders = {}) => {
      const ctx = await playwrightRequest.newContext({ baseURL, extraHTTPHeaders: { Cookie: cookie, ...extraHeaders } });
      contexts.push(ctx);
      return ctx;
    });
    await Promise.all(contexts.map((c) => c.dispose()));
  },

  pageAs: async ({ browser }, provide) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    await provide(async (role) => {
      const context = await browser.newContext();
      // Logging in through the context's request client stores the session
      // cookie in the same cookie jar the page uses.
      await login(context.request, role);
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((c) => c.close()));
  },
});

/** Wait for text to appear (pages stream in after a loading screen). False if it never appears. */
export async function waitForText(page: Page, text: string, timeout = 15_000) {
  try {
    await page.getByText(text).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

/** Call a route from the inventory. Bodies are sent only for methods that take one. */
export function call(ctx: APIRequestContext, route: RouteCase, data: unknown = {}, headers: Record<string, string> = {}) {
  return ctx.fetch(route.path, {
    method: route.method,
    data: route.method === "GET" ? undefined : data,
    headers,
    maxRedirects: 0,
  });
}

async function login(ctx: APIRequestContext, role: AccountRole) {
  const res = await ctx.post("/api/auth/login", {
    data: { email: ACCOUNTS[role], password: uatPassword() },
  });
  if (res.status() !== 200) {
    throw new Error(`Login as ${role} (${ACCOUNTS[role]}) failed with ${res.status()}: ${await res.text()}`);
  }
}

export { expect };
