import type { Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";

// TC-REG-01 Regression: existing workflows still work (test-cases.md, step 4).
// Steps 1-3 are the other test cases and `npm run test:sfr05` (run by TC-SFR-05).
const MEMBER_PAGES = [
  "/member", "/member/events", "/member/benefit", "/member/community", "/member/notifications",
  "/member/profile", "/member/settings", "/member/tier-upgrade", "/member/payment",
];
const ADMIN_PAGES = [
  "/admin/dashboard", "/admin/members", "/admin/events", "/admin/announcements", "/admin/engagement",
  "/admin/comment-moderation", "/admin/tier-requests", "/admin/analytics", "/admin/payment-methods",
  "/admin/team", "/admin/batch-onboarding", "/admin/settings",
];
const BROKEN = /Application error|Internal Server Error|Something went wrong|This page could not be found/i;

test("TC-REG-01 regression: member and admin journeys", async ({ evidence, pageAs }) => {
  test.setTimeout(240_000);
  const ev = evidence.start("TC-REG-01", "Regression: existing workflows still work");

  async function journey(label: string, page: Page, urls: string[], area: string) {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const url of urls) {
      const before = errors.length;
      const res = await page.goto(url);
      await page.waitForLoadState("networkidle").catch(() => {});
      const path = new URL(page.url()).pathname;
      const text = await page.locator("body").innerText();
      const problems = [
        (res?.status() ?? 0) >= 400 && `HTTP ${res?.status()}`,
        !path.startsWith(area) && `redirected to ${path}`,
        BROKEN.test(text) && `error text: "${BROKEN.exec(text)?.[0]}"`,
        errors.length > before && `page error: ${errors[errors.length - 1].slice(0, 80)}`,
      ].filter(Boolean);
      ev.check(`4 ${label} ${url}`, "loads, stays in portal, no errors", problems.length ? problems.join("; ") : `loaded (${res?.status()})`, problems.length === 0);
      await ev.screenshot(page, `${label} ${url}`);
    }
  }

  await journey("member", await pageAs("memberA"), MEMBER_PAGES, "/member");
  await journey("admin", await pageAs("admin"), ADMIN_PAGES, "/admin");

  expect(ev.passed, "all TC-REG-01 checks pass").toBe(true);
});
