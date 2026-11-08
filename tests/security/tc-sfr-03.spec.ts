import { test, expect, waitForText } from "./support/fixtures";
import { db, must, userFor, createEvent, deleteEvent, FIXTURE_TAG } from "./support/db";

// TC-SFR-03 Membership-tier access control (test-cases.md)
// All UAT members are basic tier, so the test creates its own ordinary-only content.
test("TC-SFR-03 membership-tier access control", async ({ evidence, apiAs, pageAs }) => {
  test.setTimeout(120_000);
  const ev = evidence.start("TC-SFR-03", "Membership-tier access control");
  const a = await userFor("memberA");
  const c = await userFor("memberC");
  const GROUP_ID = "security-test-ordinary";
  const ids = { e1: "", e2: "", benefit: "" };
  let groupCreated = false;

  try {
    ids.e1 = await createEvent({ title: "SFR-03 E1 basic" , tiers: ["basic"] });
    ids.e2 = await createEvent({ title: "SFR-03 E2 ordinary only", tiers: ["ordinary"] });
    ids.benefit = must(
      await db()
        .from("benefits")
        .insert({
          merchant_name: `${FIXTURE_TAG} SFR-03 B1 ordinary only`, category: "Food",
          discount_description: `${FIXTURE_TAG} ordinary-only discount`, is_active: true,
          audience_type: "selected_tiers", eligible_tiers: ["ordinary"], show_locked_preview: false,
        })
        .select("id")
        .single<{ id: string }>(),
      "create benefit",
    )!.id;
    must(
      await db().from("discussion_groups").insert({
        id: GROUP_ID, title: `${FIXTURE_TAG} ordinary-only group`, sort_order: 999,
        audience_type: "selected_tiers", eligible_tiers: ["ordinary"], show_locked_preview: false,
      }),
      "create discussion group",
    );
    groupCreated = true;

    const api = await apiAs("memberA");

    // Step 1 (control): basic member registers for a basic-tier event.
    const r1 = await api.post("/api/events/rsvp", { data: { eventId: ids.e1 } });
    await ev.http("1 RSVP to E1 (basic)", "POST", "/api/events/rsvp", r1, { eventId: ids.e1 });
    ev.check("1 basic member registers for basic-tier event E1", "200", String(r1.status()), r1.status() === 200);

    // Step 2: basic member calls the RSVP API directly for an ordinary-only event.
    const r2 = await api.post("/api/events/rsvp", { data: { eventId: ids.e2 } });
    await ev.http("2 RSVP to E2 (ordinary only)", "POST", "/api/events/rsvp", r2, { eventId: ids.e2 });
    const { count: e2Regs } = await db().from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", ids.e2);
    ev.check("2 RSVP to ordinary-only E2 refused", "403, no registration created", `${r2.status()}, ${e2Regs} registration(s)`, r2.status() === 403 && e2Regs === 0);

    // Step 3: RSVP link for E2.
    const r3 = await api.get(`/api/events/rsvp?eventId=${ids.e2}`, { maxRedirects: 0 });
    await ev.http("3 GET RSVP link for E2", "GET", `/api/events/rsvp?eventId=${ids.e2}`, r3);
    ev.check("3 RSVP link for E2 not revealed", "404, no redirect", `${r3.status()}${r3.headers()["location"] ? `, redirects to ${r3.headers()["location"]}` : ""}`, r3.status() === 404);

    const page = await pageAs("memberA");

    // Step 4: open E2's page directly.
    await page.goto(`/member/events/${ids.e2}`);
    const e2NotFound = await waitForText(page, "This page could not be found");
    const e2InSource = (await page.content()).includes("SFR-03 E2 ordinary only");
    ev.check("4 E2 detail page blocked", "not-found screen; E2 not in page source", `${e2NotFound ? "not-found screen" : "page rendered"}; E2 ${e2InSource ? "IN source" : "not in source"}`, e2NotFound && !e2InSource);
    await ev.screenshot(page, "memberA opens ordinary-only event");

    // Step 5: events list.
    await page.goto("/member/events");
    await waitForText(page, "SFR-03 E1 basic");
    const listHtml = await page.content();
    ev.check("5 events list omits E2", "E2 not listed (E1 listed as control)",
      `E2 ${listHtml.includes("SFR-03 E2 ordinary only") ? "LISTED" : "not listed"}; E1 ${listHtml.includes("SFR-03 E1 basic") ? "listed" : "not listed"}`,
      !listHtml.includes("SFR-03 E2 ordinary only") && listHtml.includes("SFR-03 E1 basic"));

    // Step 6: benefits page.
    await page.goto("/member/benefit");
    const benefitHtml = await page.content();
    ev.check("6 benefits page omits ordinary-only B1", "B1 not in page source", benefitHtml.includes("SFR-03 B1 ordinary only") || benefitHtml.includes("ordinary-only discount") ? "B1 IN source" : "B1 not in source",
      !benefitHtml.includes("SFR-03 B1 ordinary only") && !benefitHtml.includes("ordinary-only discount"));
    await ev.screenshot(page, "memberA benefits page");

    // Step 7: expired membership loses access even to an allowed tier.
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    must(await db().from("users").update({ expiry_date: yesterday }).eq("id", c.id), "expire memberC");
    try {
      const apiC = await apiAs("memberC");
      const r7 = await apiC.post("/api/events/rsvp", { data: { eventId: ids.e1 } });
      await ev.http("7 RSVP to E1 with expired membership", "POST", "/api/events/rsvp", r7, { eventId: ids.e1 });
      const { count: cRegs } = await db().from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", ids.e1).eq("user_id", c.id);
      ev.check("7 expired member refused even for allowed tier", "403, no registration", `${r7.status()}, ${cRegs} registration(s)`, r7.status() === 403 && cRegs === 0);
    } finally {
      must(await db().from("users").update({ expiry_date: c.expiry_date }).eq("id", c.id), "restore memberC expiry");
    }

    // Step 8: post to an ordinary-only discussion group.
    const r8 = await api.post("/api/community/threads", { data: { groupId: GROUP_ID, title: "tier test", body: `${FIXTURE_TAG} tier test post` } });
    await ev.http("8 post to ordinary-only group", "POST", "/api/community/threads", r8);
    const { count: posts } = await db().from("discussion").select("id", { count: "exact", head: true }).eq("group_id", GROUP_ID);
    ev.check("8 post to ordinary-only group refused", "403 or 404, no thread created", `${r8.status()}, ${posts} thread(s)`, [403, 404].includes(r8.status()) && posts === 0);
  } finally {
    const { data: regs } = await db().from("event_registrations").select("id").in("event_id", [ids.e1, ids.e2].filter(Boolean));
    if (regs?.length) await db().from("email_outbox").delete().in("source_id", regs.map((r) => r.id));
    for (const id of [ids.e1, ids.e2]) if (id) await deleteEvent(id);
    if (ids.benefit) await db().from("benefits").delete().eq("id", ids.benefit);
    if (groupCreated) {
      await db().from("discussion").delete().eq("group_id", GROUP_ID);
      await db().from("discussion_groups").delete().eq("id", GROUP_ID);
    }
    await db().from("analytics_events").delete().eq("user_id", a.id).in("target_id", [ids.e1, ids.e2].filter(Boolean));
  }

  expect(ev.passed, "all TC-SFR-03 checks pass").toBe(true);
});
