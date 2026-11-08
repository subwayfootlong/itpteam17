import fs from "node:fs";
import path from "node:path";
import type { APIResponse } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { findLeaks } from "./support/leaks";
import { NO_SUCH_ID } from "./support/routes";
import { db, FIXTURE_TAG } from "./support/db";

// TC-SNFR-03 Controlled error disclosure (test-cases.md)
test("TC-SNFR-03 controlled error disclosure", async ({ evidence, apiAs, anonApi, page }) => {
  test.setTimeout(180_000);
  const ev = evidence.start("TC-SNFR-03", "Controlled error disclosure");
  const member = await apiAs("memberA");
  const admin = await apiAs("admin");
  const seenHeaders: Record<string, string>[] = [];

  async function noLeak(step: string, res: APIResponse, expectStatus: (s: number) => boolean, expectedLabel: string) {
    const body = await res.text();
    seenHeaders.push(res.headers());
    const leaks = findLeaks(body);
    const ok = expectStatus(res.status()) && leaks.length === 0;
    ev.check(step, `${expectedLabel}; no internal detail`, `${res.status()}; ${leaks.length ? `LEAKS: ${leaks.join(", ")}` : `"${body.slice(0, 70)}"`}`, ok);
    if (!ok) await ev.http(step, "", res.url(), res);
  }
  const is4xx = (s: number) => s >= 400 && s < 500;

  try {
    // Step 1: malformed input across the APIs.
    const malformed: [string, Promise<APIResponse>][] = [
      ["1 malformed JSON to POST /api/community/threads", member.post("/api/community/threads", { headers: { "Content-Type": "application/json" }, data: "{bad" })],
      ["1 wrong types to PATCH /api/member/profile", member.patch("/api/member/profile", { data: { first_name: { $ne: null }, phone: [1] } })],
      ["1 invalid UUID to POST /api/events/rsvp", member.post("/api/events/rsvp", { data: { eventId: "'; DROP TABLE events;--" } })],
      ["1 invalid UUID in admin path /api/admin/events/not-a-uuid", admin.get("/api/admin/events/not-a-uuid")],
      ["1 invalid UUID in admin path /api/admin/members/not-a-uuid", admin.get("/api/admin/members/not-a-uuid")],
      ["1 invalid UUID in admin path /api/admin/announcements/1 or 1=1", admin.get("/api/admin/announcements/1%20or%201=1")],
      ["1 PostgREST filter characters in member search", admin.get("/api/admin/members?search=a),or(role.eq.admin")],
    ];
    for (const [step, p] of malformed) await noLeak(step, await p, is4xx, "4xx");

    // Step 2: ids that do not exist.
    const missing: [string, Promise<APIResponse>][] = [
      ["2 unknown event id", admin.get(`/api/admin/events/${NO_SUCH_ID}`)],
      ["2 unknown announcement id", admin.get(`/api/admin/announcements/${NO_SUCH_ID}`)],
      ["2 unknown member id", admin.get(`/api/admin/members/${NO_SUCH_ID}`)],
      ["2 unknown event for RSVP", member.post("/api/events/rsvp", { data: { eventId: NO_SUCH_ID } })],
      ["2 unknown notification id", member.patch("/api/member/notifications", { data: { id: NO_SUCH_ID, isRead: true } })],
    ];
    for (const [step, p] of missing) await noLeak(step, await p, (s) => s === 404 || s === 200, "404 or harmless no-op");

    // Step 3: oversized body and wrong content type.
    await noLeak("3 1 MB body to POST /api/community/threads", await member.post("/api/community/threads", { data: { groupId: "general", body: "x".repeat(1024 * 1024) } }), is4xx, "4xx");
    await noLeak("3 XML body to PATCH /api/member/profile", await member.patch("/api/member/profile", { headers: { "Content-Type": "application/xml" }, data: "<profile><first_name>x</first_name></profile>" }), is4xx, "4xx");
    await noLeak("3 non-image upload to /api/admin/upload", await admin.post("/api/admin/upload", { multipart: { file: { name: "evil.php", mimeType: "application/x-php", buffer: Buffer.from("<?php echo 1; ?>") } } }), is4xx, "4xx");

    // Step 4: garbage tokens and bad secrets.
    for (const t of ["garbage", "a.b.c", "x".repeat(3000)]) {
      await noLeak(`4 verify QR "${t.slice(0, 12)}${t.length > 12 ? "…" : ""}"`, await anonApi.get(`/api/verify/member?token=${t}`), is4xx, "4xx");
    }
    await noLeak("4 email worker with bad secret", await anonApi.post("/api/internal/transactional-emails", { headers: { Authorization: "Bearer nope" } }), (s) => s === 401, "401");
    await noLeak("4 notification worker with bad secret", await anonApi.post("/api/internal/email-change-notifications", { headers: { Authorization: "Bearer nope" } }), (s) => s === 401, "401");

    // Step 5: unknown page and unknown API path.
    const nav = await page.goto("/this-page-does-not-exist");
    const pageLeaks = findLeaks(await page.content());
    ev.check("5 unknown page", "404 page; no internal detail", `${nav?.status()}; ${pageLeaks.length ? `LEAKS: ${pageLeaks.join(", ")}` : "generic 404 page"}`, nav?.status() === 404 && pageLeaks.length === 0);
    await ev.screenshot(page, "unknown page");
    await noLeak("5 unknown API path", await anonApi.get("/api/does-not-exist"), (s) => s === 404, "404");

    // Step 6: no framework or server version headers on any response above.
    const revealing = new Set<string>();
    for (const h of seenHeaders) {
      if (h["x-powered-by"]) revealing.add(`X-Powered-By: ${h["x-powered-by"]}`);
      if (h["server"] && /\d/.test(h["server"])) revealing.add(`Server: ${h["server"]}`);
    }
    ev.check("6 no X-Powered-By or versioned Server header", "none", revealing.size ? [...revealing].join("; ") : `none in ${seenHeaders.length} responses`, revealing.size === 0);

    // Step 7 (inspection): generic messages to clients, detailed logs on the server.
    const routes = walk(path.join(process.cwd(), "app", "api")).filter((f) => f.endsWith("route.ts"));
    const leakyReturn = routes.filter((f) => /json\(\s*\{[^}]*\b(?:error|err|e)\.(?:message|details|hint|stack)/.test(fs.readFileSync(f, "utf8")));
    ev.check("7 no handler returns a raw error message to the client", "0 files", leakyReturn.length ? leakyReturn.map(rel).join(", ") : "0 files", leakyReturn.length === 0);
    // Every 5xx response must have a log call just before it, not merely somewhere in the file.
    for (const f of routes) {
      const sites = fiveXxSites(fs.readFileSync(f, "utf8"));
      if (!sites.length) continue;
      const unlogged = sites.filter((s) => !s.logged).map((s) => `line ${s.line}`);
      ev.check(`7 ${rel(f)} logs server-side when it returns 5xx`, `all ${sites.length} 5xx paths log`,
        unlogged.length ? `${unlogged.length} of ${sites.length} 5xx paths return WITHOUT logging (${unlogged.join(", ")})` : `all ${sites.length} log`,
        unlogged.length === 0);
    }
  } finally {
    await db().from("discussion").delete().ilike("body", `%${FIXTURE_TAG}%`);
  }

  expect(ev.passed, "all TC-SNFR-03 checks pass").toBe(true);
});

/**
 * Each `return` that sends a 5xx (`status: 500`, `cond ? 409 : 500`, or `respond(…, 503)`),
 * and whether a log call appears within the few lines before it in the same block.
 */
function fiveXxSites(src: string) {
  const lines = src.split(/\r?\n/);
  const fiveXx = /status:\s*(?:[^,}]*\?\s*\d+\s*:\s*)?50\d\b|\},\s*50\d\)/;
  const logCall = /console\.(?:error|warn)\(|logServerError\(/;
  const sites: { line: number; logged: boolean }[] = [];
  lines.forEach((line, i) => {
    const isReturn = /^\s*return\b/.test(line) || /^\s*if \(.+\) return\b/.test(line);
    if (!isReturn) return;
    const statement = lines.slice(i, i + 6).join("\n").split(";")[0];
    if (!fiveXx.test(statement)) return;
    const before = lines.slice(Math.max(0, i - 4), i + 1).join("\n");
    sites.push({ line: i + 1, logged: logCall.test(before) });
  });
  return sites;
}

function rel(f: string) {
  return path.relative(process.cwd(), f).replace(/\\/g, "/");
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
