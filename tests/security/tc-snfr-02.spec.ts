import fs from "node:fs";
import path from "node:path";
import { test, expect, waitForText } from "./support/fixtures";
import { db, must, userFor, FIXTURE_TAG } from "./support/db";

// TC-SNFR-02 Personal data minimisation (test-cases.md)
const FORBIDDEN_KEYS = ["password_hash", "passwordHash", "email", "phone", "user_id", "userId"];

/** Paths of identifier-named fields that hold actual text (e.g. `email: "x@y"`, not the boolean `email: true` setting). */
function personalFields(value: unknown, base = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => personalFields(v, `${base}[]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => {
      const p = base ? `${base}.${k}` : k;
      return [...(FORBIDDEN_KEYS.includes(k) && typeof v === "string" ? [p] : []), ...personalFields(v, p)];
    });
  }
  return [];
}

/** Every key in a JSON value, recursively, as paths like `requests[].status`. */
function keyPaths(value: unknown, base = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => keyPaths(v, `${base}[]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => {
      const p = base ? `${base}.${k}` : k;
      return [p, ...keyPaths(v, p)];
    });
  }
  return [];
}

test("TC-SNFR-02 personal data minimisation", async ({ evidence, apiAs, anonApi, pageAs }) => {
  test.setTimeout(120_000);
  const ev = evidence.start("TC-SNFR-02", "Personal data minimisation");
  const a = await userFor("memberA");
  const b = await userFor("memberB");
  const member = await apiAs("memberA");
  let threadId = "";

  try {
    // Step 1: member-facing GET APIs against an allowlist of fields.
    const allow: Record<string, string[]> = {
      "/api/member/notifications": ["unreadCount"],
      "/api/member/notification-preferences": ["preferences", "preferences.benefit", "preferences.announcement", "preferences.event", "preferences.email"],
      "/api/member/tier-upgrade": ["currentTier", "availableTiers", "availableTiers[].value", "availableTiers[].label", "requests", "requests[].id", "requests[].current_tier", "requests[].requested_tier", "requests[].reason", "requests[].status", "requests[].admin_note", "requests[].reviewed_at", "requests[].created_at"],
      "/api/member/qr-token": ["verificationUrl", "expiresIn"],
    };
    for (const [url, allowed] of Object.entries(allow)) {
      const res = await member.get(url);
      await ev.http(`1 GET ${url}`, "GET", url, res);
      const json = await res.json();
      const keys = [...new Set(keyPaths(json))];
      const extra = keys.filter((k) => !allowed.includes(k));
      ev.check(`1 ${url} returns only needed fields`, allowed.join(", "), extra.length ? `extra: ${extra.join(", ")}` : `only allowed fields (${keys.length})`, res.status() === 200 && extra.length === 0);
      const forbidden = [...new Set(personalFields(json))];
      ev.check(`1 ${url} has no personal identifier fields`, `none of ${FORBIDDEN_KEYS.join(", ")}`, forbidden.length ? `FOUND: ${forbidden.join(", ")}` : "none", forbidden.length === 0);
    }

    // Step 2: QR payload and verification response (detailed in TC-SFR-07).
    const { verificationUrl } = await (await member.get("/api/member/qr-token")).json();
    const token = new URL(verificationUrl).searchParams.get("token") ?? "";
    const qrKeys = Object.keys(JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())).sort().join(", ");
    ev.check("2 QR payload fields", "exp, iat, memberId, purpose", qrKeys, qrKeys === "exp, iat, memberId, purpose");
    const verified = await (await anonApi.get(`/api/verify/member?token=${encodeURIComponent(token)}`)).json();
    const vKeys = keyPaths(verified).sort().join(", ");
    ev.check("2 verify response fields", "member, member.displayName, member.expiryDate, member.membershipStatus, member.membershipTier, valid", vKeys,
      vKeys === "member, member.displayName, member.expiryDate, member.membershipStatus, member.membershipTier, valid");

    // Step 3: pages memberA can see must not carry memberB's personal data.
    threadId = must(
      await db()
        .from("discussion")
        .insert({
          group_id: "general", user_id: b.id, author_name: "Member 4", author_role: "Basic Member",
          title: `${FIXTURE_TAG} SNFR-02 thread by memberB`, body: `${FIXTURE_TAG} approved post by memberB`, status: "approved",
        })
        .select("id")
        .single<{ id: string }>(),
      "create approved thread",
    )!.id;
    must(await db().from("discussion_comments").insert({ thread_id: threadId, user_id: b.id, author_name: "Member 4", body: `${FIXTURE_TAG} approved comment by memberB`, status: "approved" }), "create comment");

    const page = await pageAs("memberA");
    const bPhoneDigits = (b.phone ?? "").replace(/\D/g, "");
    for (const url of ["/member", "/member/community", `/member/community/${threadId}`, "/member/events", "/member/benefit"]) {
      await page.goto(url);
      if (url.includes(threadId)) await waitForText(page, "approved post by memberB");
      else await page.waitForLoadState("networkidle");
      const html = await page.content();
      const found = [
        html.includes(b.email) && "memberB's email",
        bPhoneDigits && html.replace(/\D/g, " ").includes(bPhoneDigits) && "memberB's phone",
        /\$2[aby]\$\d{2}\$/.test(html) && "a password hash",
        /password_hash/.test(html) && "password_hash",
        html.includes(b.id) && "memberB's user id",
      ].filter(Boolean);
      ev.check(`3 ${url} (as memberA)`, "no other member's email, phone, id or password hash", found.length ? `FOUND: ${found.join(", ")}` : "none found", found.length === 0);
      if (url.includes(threadId)) await ev.screenshot(page, "thread by memberB as seen by memberA");
    }

    // Step 4: login does not reveal whether an account exists.
    const unknown = await anonApi.post("/api/auth/login", { data: { email: "no-such-user-9f3k@uat.pergas.org", password: "WrongPassword1" } });
    const wrongPw = await anonApi.post("/api/auth/login", { data: { email: a.email, password: "WrongPassword1" } });
    const u = `${unknown.status()} ${await unknown.text()}`;
    const w = `${wrongPw.status()} ${await wrongPw.text()}`;
    ev.check("4 login: unknown email and wrong password look the same", "identical status and message", u === w ? `both ${u}` : `unknown: ${u} | wrong password: ${w}`, u === w);
    // Email change only reveals "already registered" after the password is verified (see TC-SFR-08 step 3).
    const memberC = await apiAs("memberC");
    const origin = { Origin: new URL(page.url()).origin };
    const probe = await memberC.post("/api/member/email-change/request", { data: { newEmail: a.email, currentPassword: "WrongPassword1" }, headers: origin });
    ev.check("4 email change with wrong password does not confirm an existing address", "401 (not 409)", String(probe.status()), probe.status() === 401);

    // Step 5: admin member APIs never include password hashes.
    const admin = await apiAs("admin");
    for (const url of ["/api/admin/members", `/api/admin/members/${a.id}`, "/api/admin/team", "/api/admin/dashboard"]) {
      const res = await admin.get(url);
      const text = await res.text();
      const leak = /password_hash|passwordHash|\$2[aby]\$\d{2}\$/.test(text);
      ev.check(`5 ${url} has no password hash`, "no password_hash", `${res.status()}, ${leak ? "PASSWORD HASH PRESENT" : "none"}`, res.status() === 200 && !leak);
    }

    // Step 6 (inspection): explicit column lists; password_hash only where authentication needs it.
    const files = walk(path.join(process.cwd(), "app")).concat(walk(path.join(process.cwd(), "lib"))).filter((f) => /\.(ts|tsx)$/.test(f));
    const starSelects = files.filter((f) => /\.select\(\s*(['"`])\*\1/.test(fs.readFileSync(f, "utf8")));
    ev.check("6 no select(\"*\") in app or lib", "0 files", starSelects.length ? starSelects.map((f) => path.relative(process.cwd(), f)).join(", ") : "0 files", starSelects.length === 0);
    const allowedHashFiles = ["app/api/auth/login/route.ts", "app/api/auth/register/route.ts", "app/api/member/change-password/route.ts", "app/api/admin/batch-onboarding/route.ts", "lib/emailChange.ts", "lib/emailChangeServer.ts"];
    const hashFiles = files.filter((f) => fs.readFileSync(f, "utf8").includes("password_hash")).map((f) => path.relative(process.cwd(), f).replace(/\\/g, "/"));
    const unexpected = hashFiles.filter((f) => !allowedHashFiles.includes(f));
    ev.check("6 password_hash only in authentication code", allowedHashFiles.join(", "), unexpected.length ? `also in: ${unexpected.join(", ")}` : hashFiles.join(", "), unexpected.length === 0);
  } finally {
    if (threadId) {
      await db().from("discussion_comments").delete().eq("thread_id", threadId);
      await db().from("discussion").delete().eq("id", threadId);
    }
    await db().from("email_change_limits").delete().eq("user_id", (await userFor("memberC")).id);
  }

  expect(ev.passed, "all TC-SNFR-02 checks pass").toBe(true);
});

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
