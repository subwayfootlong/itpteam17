import bcrypt from "bcryptjs";
import { test, expect } from "./support/fixtures";
import { ACCOUNTS, uatPassword } from "./support/accounts";
import { db, must, userFor, FIXTURE_TAG } from "./support/db";

// TC-REG-02 Regression: admin and member save actions complete (test-cases.md).
// TC-REG-01 only loads pages; this completes the saves the security fixes touched
// (the DEF-08 logging changes wrapped every admin save path, DEF-03 changed sessions).
// Side effects are avoided on purpose: test benefits and payment methods are created
// inactive (an active benefit notifies every member; an active payment method switches
// off the real one), the event stays a draft (publishing notifies members), and every
// change to a real record is restored.
const POLL_ANNOUNCEMENT_TITLE = "Jalsah Asatizah";
const TEMP_PASSWORD = "Reg-Test-Pass-2026!";

test("TC-REG-02 regression: admin and member save actions", async ({ evidence, apiAs, anonApi }) => {
  test.setTimeout(180_000);
  const ev = evidence.start("TC-REG-02", "Regression: admin and member save actions complete");
  const admin = await apiAs("admin");
  const b = await userFor("memberB");
  const c = await userFor("memberC");
  const a = await userFor("memberA");
  const created = { benefit: "", payment: "", event: "", tierRequest: "" };
  const restore = { pollAnnouncement: "", passwordHash: "" };
  const { data: cBefore } = await db().from("users").select("designation").eq("id", c.id).single();
  const { data: bPassword } = await db().from("users").select("password_hash").eq("id", b.id).single();
  restore.passwordHash = bPassword?.password_hash ?? "";

  const step = async (label: string, res: Awaited<ReturnType<typeof admin.get>>, expected: number[], body?: unknown) => {
    const ok = expected.includes(res.status());
    if (!ok) await ev.http(label, "", res.url(), res, body);
    ev.check(label, expected.join(" or "), String(res.status()), ok);
    return ok;
  };

  try {
    // Step 1: benefit create, edit, delete (inactive, so no member notifications).
    const benefitBody = { merchant_name: `${FIXTURE_TAG} REG benefit`, category: "Food", discount_description: "10% off", is_active: false };
    const r1 = await admin.post("/api/admin/engagement", { data: benefitBody });
    await step("1 admin creates a benefit", r1, [201], benefitBody);
    created.benefit = (await r1.json()).benefit?.id ?? "";
    await step("1 admin edits the benefit", await admin.patch(`/api/admin/engagement/${created.benefit}`, { data: { discount_description: "15% off", is_active: false } }), [200]);
    const { data: bnf } = await db().from("benefits").select("discount_description").eq("id", created.benefit).maybeSingle();
    ev.check("1 benefit edit saved", "15% off", String(bnf?.discount_description), bnf?.discount_description === "15% off");
    await step("1 admin deletes the benefit", await admin.delete(`/api/admin/engagement/${created.benefit}`), [200]);
    const { count: bLeft } = await db().from("benefits").select("id", { count: "exact", head: true }).eq("id", created.benefit);
    if (bLeft === 0) created.benefit = "";
    ev.check("1 benefit deleted", "0 rows", `${bLeft} rows`, bLeft === 0);

    // Step 2: payment method create, edit, delete (inactive, so the real one stays active).
    const { count: activeBefore } = await db().from("payment_methods").select("id", { count: "exact", head: true }).eq("is_active", true);
    const pmBody = { name: `${FIXTURE_TAG} REG payment`, payment_url: "https://example.com/pay", is_active: false };
    const r2 = await admin.post("/api/admin/payment-methods", { data: pmBody });
    await step("2 admin creates a payment method", r2, [200, 201], pmBody);
    created.payment = (await r2.json()).paymentMethod?.id ?? "";
    await step("2 admin edits the payment method", await admin.patch(`/api/admin/payment-methods/${created.payment}`, { data: { description: "edited", is_active: false } }), [200]);
    await step("2 admin deletes the payment method", await admin.delete(`/api/admin/payment-methods/${created.payment}`), [200]);
    const { count: pLeft } = await db().from("payment_methods").select("id", { count: "exact", head: true }).eq("id", created.payment);
    if (pLeft === 0) created.payment = "";
    const { count: activeAfter } = await db().from("payment_methods").select("id", { count: "exact", head: true }).eq("is_active", true);
    ev.check("2 payment method deleted; real active method untouched", `0 rows; ${activeBefore} active`, `${pLeft} rows; ${activeAfter} active`, pLeft === 0 && activeAfter === activeBefore);

    // Step 3: event create (draft), edit, delete.
    const evTitle = `${FIXTURE_TAG} REG draft event`;
    await step("3 admin creates a draft event", await admin.post("/api/admin/events", { data: { title: evTitle, category: "General", event_date: "2099-01-01", status: "draft" } }), [201]);
    const { data: evRow } = await db().from("events").select("id").eq("title", evTitle).maybeSingle();
    created.event = evRow?.id ?? "";
    await step("3 admin edits the event", await admin.patch(`/api/admin/events/${created.event}`, { data: { venue: "Edited venue", status: "draft" } }), [200]);
    await step("3 admin deletes the event", await admin.delete(`/api/admin/events/${created.event}`), [200]);
    const { count: eLeft } = await db().from("events").select("id", { count: "exact", head: true }).eq("id", created.event);
    if (eLeft === 0) created.event = "";
    ev.check("3 event deleted", "0 rows", `${eLeft} rows`, eLeft === 0);

    // Step 4: admin edits a member's record (restored in finally).
    await step("4 admin edits a member (memberC)", await admin.patch(`/api/admin/members/${c.id}`, { data: { designation: `${FIXTURE_TAG} REG` } }), [200]);
    const { data: cAfter } = await db().from("users").select("designation").eq("id", c.id).single();
    ev.check("4 member edit saved", `${FIXTURE_TAG} REG`, String(cAfter?.designation), cAfter?.designation === `${FIXTURE_TAG} REG`);

    // Step 5: a member requests a tier upgrade and the admin approves it (tier restored in finally).
    const memberB = await apiAs("memberB");
    const r5 = await memberB.post("/api/member/tier-upgrade", { data: { requestedTier: "student", reason: `${FIXTURE_TAG} REG tier request` } });
    await step("5 member submits a tier-upgrade request", r5, [201]);
    created.tierRequest = (await r5.json()).request?.id ?? "";
    await step("5 admin approves it", await admin.patch("/api/admin/tier-requests", { data: { id: created.tierRequest, action: "approve" } }), [200]);
    const { data: bTier } = await db().from("users").select("membership_tier").eq("id", b.id).single();
    ev.check("5 member's tier updated", "student", String(bTier?.membership_tier), bTier?.membership_tier === "student");

    // Step 6: member votes in the announcement poll (vote removed in finally).
    const { data: poll } = await db().from("announcements").select("id").eq("title", POLL_ANNOUNCEMENT_TITLE).eq("poll_enabled", true).eq("status", "published").maybeSingle();
    if (!poll) {
      ev.skip("6 member votes in an announcement poll", `no published poll announcement "${POLL_ANNOUNCEMENT_TITLE}" found`);
    } else {
      const { count: existingVote } = await db().from("announcement_poll_responses").select("id", { count: "exact", head: true }).eq("announcement_id", poll.id).eq("user_id", a.id);
      if (existingVote) {
        ev.skip("6 member votes in an announcement poll", "memberA already has a real vote; left untouched");
      } else {
        restore.pollAnnouncement = poll.id;
        const memberA = await apiAs("memberA");
        await step("6 member votes in the announcement poll", await memberA.post("/api/community/announcement-poll", { data: { announcementId: `admin:${poll.id}`, response: "yes" } }), [200]);
        const { data: vote } = await db().from("announcement_poll_responses").select("response").eq("announcement_id", poll.id).eq("user_id", a.id).maybeSingle();
        ev.check("6 vote saved", "yes", String(vote?.response), vote?.response === "yes");
      }
    }

    // Step 7: member changes their password, signs in with it, and changes it back.
    const pw = (currentPassword: string, newPassword: string) => ({ data: { currentPassword, newPassword, confirmPassword: newPassword } });
    await step("7 member changes their password", await memberB.patch("/api/member/change-password", pw(uatPassword(), TEMP_PASSWORD)), [200]);
    await step("7 member signs in with the new password", await anonApi.post("/api/auth/login", { data: { email: ACCOUNTS.memberB, password: TEMP_PASSWORD } }), [200]);
    await step("7 old password no longer works", await anonApi.post("/api/auth/login", { data: { email: ACCOUNTS.memberB, password: uatPassword() } }), [401]);
    await step("7 member changes it back", await memberB.patch("/api/member/change-password", pw(TEMP_PASSWORD, uatPassword())), [200]);
    await step("7 original password works again", await anonApi.post("/api/auth/login", { data: { email: ACCOUNTS.memberB, password: uatPassword() } }), [200]);

    // Step 8: member saves notification settings and they read back.
    const PREFS = "/api/member/notification-preferences";
    const original = (await (await memberB.get(PREFS)).json()).preferences as Record<string, boolean>;
    await step("8 member saves notification settings", await memberB.patch(PREFS, { data: { event: !original.event } }), [200]);
    const after = (await (await memberB.get(PREFS)).json()).preferences as Record<string, boolean>;
    ev.check("8 settings read back changed", `event = ${!original.event}`, `event = ${after.event}`, after.event === !original.event);
    await step("8 settings restored", await memberB.patch(PREFS, { data: { event: original.event } }), [200]);
  } finally {
    if (created.benefit) await db().from("benefits").delete().eq("id", created.benefit);
    if (created.payment) await db().from("payment_methods").delete().eq("id", created.payment);
    if (created.event) await db().from("events").delete().eq("id", created.event);
    await db().from("events").delete().ilike("title", `${FIXTURE_TAG} REG%`);
    await db().from("users").update({ designation: cBefore?.designation ?? null }).eq("id", c.id);
    if (created.tierRequest) {
      await db().from("notifications").delete().eq("source_type", "tier_upgrade_request").eq("source_id", created.tierRequest);
      await db().from("tier_upgrade_requests").delete().eq("id", created.tierRequest);
    }
    await db().from("users").update({ membership_tier: b.membership_tier }).eq("id", b.id);
    if (restore.pollAnnouncement) {
      await db().from("announcement_poll_responses").delete().eq("announcement_id", restore.pollAnnouncement).eq("user_id", a.id);
    }
    // If step 7 stopped half-way, put memberB's original password hash back.
    const { data: hashNow } = await db().from("users").select("password_hash").eq("id", b.id).single();
    if (restore.passwordHash && !(await bcrypt.compare(uatPassword(), hashNow?.password_hash ?? ""))) {
      must(await db().from("users").update({ password_hash: restore.passwordHash }).eq("id", b.id), "restore memberB password");
    }
  }

  expect(ev.passed, "all TC-REG-02 checks pass").toBe(true);
});
