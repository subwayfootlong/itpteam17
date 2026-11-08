import fs from "node:fs";
import path from "node:path";
import type { APIRequestContext } from "@playwright/test";
import { test, expect, waitForText } from "./support/fixtures";
import { BODY_ROUTES, NO_SUCH_ID, type RouteCase } from "./support/routes";
import { db, FIXTURE_TAG } from "./support/db";

// TC-SFR-04 Server-side input validation and sanitisation (test-cases.md)
type Case = { label: string; ctx: "member" | "admin"; method: "POST" | "PATCH" | "GET"; path: string; data?: unknown };

test("TC-SFR-04 server-side input validation and sanitisation", async ({ evidence, apiAs, pageAs, baseURL }) => {
  test.setTimeout(240_000);
  const ev = evidence.start("TC-SFR-04", "Server-side input validation and sanitisation");
  const member = await apiAs("memberA");
  const admin = await apiAs("admin");
  const ctxFor = (r: { path: string }) => (r.path.startsWith("/api/admin/") ? admin : member);
  // The email-change routes check Origin before reading the body; send ours so the body is what's tested.
  const originHeader = { Origin: new URL(baseURL!).origin };

  async function send(ctx: APIRequestContext, method: string, url: string, body: string | undefined, contentType = "application/json") {
    return ctx.fetch(url, {
      method,
      // Content-Type is always sent, even with an empty body, so routes that require
      // JSON (email change) get as far as parsing the body, which is what's tested.
      headers: { ...originHeader, "Content-Type": contentType },
      data: body,
      maxRedirects: 0,
    });
  }

  async function expect400(step: string, ctx: APIRequestContext, c: { method: string; path: string }, body: string | undefined) {
    const res = await send(ctx, c.method, c.path, body);
    const text = await res.text();
    let message = "";
    try { message = JSON.parse(text).error ?? ""; } catch { message = text.slice(0, 80); }
    const ok = res.status() === 400 && message.length > 0;
    ev.check(`${step}: ${c.method} ${c.path}`, "400 with a message", `${res.status()} ${message ? `"${message.slice(0, 90)}"` : "(no message)"}`, ok);
    if (!ok) await ev.http(`${step}: ${c.method} ${c.path}`, c.method, c.path, res, body);
    return res;
  }

  try {
    // Step 1: malformed JSON, a JSON array, and an empty body on every body-reading handler.
    const bodyRoutes: RouteCase[] = [...BODY_ROUTES, { method: "DELETE", path: "/api/events/rsvp" }];
    for (const route of bodyRoutes) {
      await expect400("1 malformed JSON", ctxFor(route), route, "{not json");
      await expect400("1 JSON array", ctxFor(route), route, "[]");
      await expect400("1 empty body", ctxFor(route), route, undefined);
    }

    // Steps 2-4: wrong types, over-length values, values outside the permitted set.
    const long = (n: number) => "x".repeat(n);
    const profile = { salutation: "mr", first_name: "Member", last_name: "3", phone: "+65 8100 0003", organization: "Pergas Community Member", designation: "Associate Member" };
    const cases: Case[] = [
      // Step 2: wrong types
      { label: "2 profile first_name is a number", ctx: "member", method: "PATCH", path: "/api/member/profile", data: { ...profile, first_name: 123 } },
      { label: "2 thread body is a number", ctx: "member", method: "POST", path: "/api/community/threads", data: { groupId: "general", body: 42 } },
      { label: "2 comment threadId is an object", ctx: "member", method: "POST", path: "/api/community/thread-comments", data: { threadId: { id: 1 }, body: "hi" } },
      { label: "2 rsvp eventId is a number", ctx: "member", method: "POST", path: "/api/events/rsvp", data: { eventId: 7 } },
      { label: "2 analytics eventType is a number", ctx: "member", method: "POST", path: "/api/analytics/track", data: { eventType: 5, category: "event" } },
      { label: "2 notification isRead is a string", ctx: "member", method: "PATCH", path: "/api/member/notifications", data: { id: NO_SUCH_ID, isRead: "yes" } },
      { label: "2 event capacity is a string", ctx: "admin", method: "POST", path: "/api/admin/events", data: { title: `${FIXTURE_TAG} v`, category: "General", event_date: "2099-01-01", capacity: "ten" } },
      { label: "2 announcement poll_enabled is a string", ctx: "admin", method: "POST", path: "/api/admin/announcements", data: { title: `${FIXTURE_TAG} v`, content: "x", category: "General", poll_enabled: "yes" } },
      // Step 3: over-length values
      { label: "3 thread body 801 chars", ctx: "member", method: "POST", path: "/api/community/threads", data: { groupId: "general", body: long(801) } },
      { label: "3 thread title 81 chars", ctx: "member", method: "POST", path: "/api/community/threads", data: { groupId: "general", title: long(81), body: "ok" } },
      { label: "3 comment body 501 chars", ctx: "member", method: "POST", path: "/api/community/thread-comments", data: { threadId: NO_SUCH_ID, body: long(501) } },
      { label: "3 profile first_name 101 chars", ctx: "member", method: "PATCH", path: "/api/member/profile", data: { ...profile, first_name: long(101) } },
      { label: "3 tier-upgrade reason 1001 chars", ctx: "member", method: "POST", path: "/api/member/tier-upgrade", data: { requestedTier: "ordinary", reason: long(1001) } },
      { label: "3 event title 201 chars", ctx: "admin", method: "POST", path: "/api/admin/events", data: { title: long(201), category: "General", event_date: "2099-01-01" } },
      // Step 4: values outside the permitted set
      { label: "4 profile salutation 'king'", ctx: "member", method: "PATCH", path: "/api/member/profile", data: { ...profile, salutation: "king" } },
      { label: "4 tier-upgrade tier 'platinum'", ctx: "member", method: "POST", path: "/api/member/tier-upgrade", data: { requestedTier: "platinum", reason: "test" } },
      { label: "4 notification action 'explode'", ctx: "member", method: "PATCH", path: "/api/member/notifications", data: { action: "explode" } },
      { label: "4 poll response 'perhaps'", ctx: "member", method: "POST", path: "/api/community/announcement-poll", data: { announcementId: NO_SUCH_ID, response: "perhaps" } },
      { label: "4 analytics category 'secret'", ctx: "member", method: "POST", path: "/api/analytics/track", data: { eventType: "event_view", category: "secret" } },
      { label: "4 event status 'live'", ctx: "admin", method: "POST", path: "/api/admin/events", data: { title: `${FIXTURE_TAG} v`, category: "General", event_date: "2099-01-01", status: "live" } },
      { label: "4 tier-request action 'escalate'", ctx: "admin", method: "PATCH", path: "/api/admin/tier-requests", data: { id: NO_SUCH_ID, action: "escalate" } },
      { label: "4 member list tier 'gold'", ctx: "admin", method: "GET", path: "/api/admin/members?tier=gold" },
    ];
    for (const c of cases) {
      await expect400(c.label, c.ctx === "admin" ? admin : member, c, c.method === "GET" ? undefined : JSON.stringify(c.data));
    }

    // Steps 5-6: markup in posts and comments is rejected.
    const payloads = ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "<svg/onload=alert(1)>", "<!--x-->"];
    for (const p of payloads) {
      const step = p.startsWith("<script") ? "5" : "6";
      await expect400(`${step} thread with ${p}`, member, { method: "POST", path: "/api/community/threads" }, JSON.stringify({ groupId: "general", body: `${FIXTURE_TAG} ${p}` }));
      await expect400(`${step} thread comment with ${p}`, member, { method: "POST", path: "/api/community/thread-comments" }, JSON.stringify({ threadId: NO_SUCH_ID, body: p }));
      await expect400(`${step} announcement comment with ${p}`, member, { method: "POST", path: "/api/community/announcement-comments" }, JSON.stringify({ announcementId: NO_SUCH_ID, body: p }));
    }
    const { count: stored } = await db().from("discussion").select("id", { count: "exact", head: true }).ilike("body", `%${FIXTURE_TAG}%<%`);
    ev.check("5-6 no markup payload stored", "0 rows", `${stored} row(s)`, stored === 0);

    // Step 7: plain text with < > " is accepted and shown literally.
    const text = `${FIXTURE_TAG} a < b && c > "d" (5 <3)`;
    const r7 = await member.post("/api/community/threads", { data: { groupId: "general", title: "Escaping check", body: text } });
    const threadId: string | undefined = (await r7.json()).thread?.id;
    ev.check("7 plain text with < > \" accepted", "200", String(r7.status()), r7.status() === 200 && !!threadId);
    if (threadId) {
      const page = await pageAs("memberA");
      let dialogs = 0;
      page.on("dialog", (d) => { dialogs++; void d.dismiss(); });
      await page.goto(`/member/community/${threadId}`);
      const shown = await waitForText(page, 'a < b && c > "d" (5 <3)');
      ev.check("7 text shown literally, no script ran", "text visible as typed; 0 dialogs", `${shown ? "visible as typed" : "NOT visible as typed"}; ${dialogs} dialog(s)`, shown && dialogs === 0);
      await ev.screenshot(page, "plain text with angle brackets");
    }

    // Step 8: unsafe URL schemes rejected.
    for (const url of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>"]) {
      await expect400(`8 event RSVP URL ${url.slice(0, 15)}`, admin, { method: "POST", path: "/api/admin/events" },
        JSON.stringify({ title: `${FIXTURE_TAG} url`, category: "General", event_date: "2099-01-01", external_rsvp_url: url }));
    }

    // Step 9 (inspection): every route that reads input calls a validator.
    const apiDir = path.join(process.cwd(), "app", "api");
    const files = walk(apiDir).filter((f) => f.endsWith("route.ts"));
    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      const reads = /readJsonObject|\.json\(\)|formData\(\)|searchParams\.get/.test(src);
      if (!reads) continue;
      const validates = /require(String|PlainText|Uuid|Enum|Integer|Date|Email|WebUrl)\(|validate\w+\(|isUuid\(|isOneOf\(|InputValidationError|inputError\(|ALLOWED_|MAX_|verify\w*Token\(|typeof \w+(\.\w+)? !==/.test(src);
      ev.check(`9 ${path.relative(process.cwd(), file).replace(/\\/g, "/")}`, "reads input and validates it", validates ? "validates" : "NO validator found", validates);
    }
  } finally {
    await db().from("discussion").delete().ilike("body", `%${FIXTURE_TAG}%`);
    await db().from("events").delete().ilike("title", `%${FIXTURE_TAG}%`);
    await db().from("announcements").delete().ilike("title", `%${FIXTURE_TAG}%`);
  }

  expect(ev.passed, "all TC-SFR-04 checks pass").toBe(true);
});

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

