import { test, expect, waitForText } from "./support/fixtures";
import { db, must, userFor, createEvent, deleteEvent, FIXTURE_TAG } from "./support/db";

// TC-SFR-02 Resource-level access control (test-cases.md)
// memberA tries to read or change memberB's data by changing IDs.
test("TC-SFR-02 resource-level access control", async ({ evidence, apiAs, pageAs }) => {
  test.setTimeout(120_000);
  const ev = evidence.start("TC-SFR-02", "Resource-level access control");
  const a = await userFor("memberA");
  const b = await userFor("memberB");

  // Fixtures owned by memberB (all deleted in `finally`).
  const created = { notificationId: "", eventId: "", threadId: "", tierRequestId: "" };
  const { data: aProfileBefore } = await db().from("users").select("designation").eq("id", a.id).single();
  const { data: bProfileBefore } = await db()
    .from("users")
    .select("salutation, first_name, last_name, phone, organization, designation")
    .eq("id", b.id)
    .single();

  try {
    created.notificationId = must(
      await db()
        .from("notifications")
        .insert({
          user_id: b.id, type: "Announcement", priority: "Medium", title: `${FIXTURE_TAG} memberB notification`,
          message: FIXTURE_TAG, action_label: "View", action_href: "/member", source_type: "announcement",
          source_id: "security-test", is_read: false,
        })
        .select("id")
        .single<{ id: string }>(),
      "create notification",
    )!.id;
    created.eventId = await createEvent({ title: "SFR-02 ownership event" });
    must(await db().from("event_registrations").insert({ event_id: created.eventId, user_id: b.id, status: "registered" }), "register memberB");
    created.threadId = must(
      await db()
        .from("discussion")
        .insert({
          group_id: "general", user_id: b.id, author_name: "Member 4", title: `${FIXTURE_TAG} memberB pending thread`,
          body: `${FIXTURE_TAG} pending thread owned by memberB`, status: "pending",
        })
        .select("id")
        .single<{ id: string }>(),
      "create thread",
    )!.id;
    created.tierRequestId = must(
      await db()
        .from("tier_upgrade_requests")
        .insert({ user_id: b.id, current_tier: "basic", requested_tier: "ordinary", reason: FIXTURE_TAG, status: "pending" })
        .select("id")
        .single<{ id: string }>(),
      "create tier request",
    )!.id;

    const api = await apiAs("memberA");

    // Step 1: profile update carrying memberB's id. Only memberA's row may change.
    const marker = `${FIXTURE_TAG} A`;
    const body = {
      id: b.id, user_id: b.id, salutation: "mr", first_name: "Member", last_name: "3",
      phone: "+65 8100 0003", organization: "Pergas Community Member", designation: marker,
    };
    const res1 = await api.patch("/api/member/profile", { data: body });
    await ev.http("1 PATCH profile with memberB's id", "PATCH", "/api/member/profile", res1, body);
    const { data: aAfter } = await db().from("users").select("designation").eq("id", a.id).single();
    const { data: bAfter } = await db()
      .from("users")
      .select("salutation, first_name, last_name, phone, organization, designation")
      .eq("id", b.id)
      .single();
    ev.check("1 memberA's own profile updated", `designation = "${marker}"`, `${res1.status()}, designation = "${aAfter?.designation}"`, aAfter?.designation === marker);
    ev.check("1 memberB's profile unchanged", "identical to before", JSON.stringify(bAfter) === JSON.stringify(bProfileBefore) ? "identical" : `changed: ${JSON.stringify(bAfter)}`, JSON.stringify(bAfter) === JSON.stringify(bProfileBefore));

    // Step 2: mark memberB's notification read by its id.
    const res2 = await api.patch("/api/member/notifications", { data: { id: created.notificationId, isRead: true } });
    await ev.http("2 PATCH memberB's notification", "PATCH", "/api/member/notifications", res2, { id: created.notificationId, isRead: true });
    const { data: n } = await db().from("notifications").select("is_read").eq("id", created.notificationId).single();
    ev.check("2 memberB's notification still unread", "is_read = false", `${res2.status()}, is_read = ${n?.is_read}`, n?.is_read === false);

    // Step 3: memberA's notification count reflects only memberA's notifications.
    const res3 = await api.get("/api/member/notifications");
    const count = (await res3.json()).unreadCount;
    const { count: aUnread } = await db()
      .from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", a.id).eq("is_read", false).eq("is_deleted", false);
    ev.check("3 GET notifications counts only memberA's", `unreadCount = ${aUnread} (memberA's own)`, `unreadCount = ${count}`, count === aUnread);

    // Step 4: cancel the event memberB registered for.
    const res4 = await api.delete("/api/events/rsvp", { data: { eventId: created.eventId } });
    await ev.http("4 DELETE rsvp for memberB's event", "DELETE", "/api/events/rsvp", res4, { eventId: created.eventId });
    const { data: reg } = await db().from("event_registrations").select("status").eq("event_id", created.eventId).eq("user_id", b.id).maybeSingle();
    ev.check("4 memberB's registration still exists", "status = registered", `${res4.status()}, status = ${reg?.status ?? "deleted"}`, reg?.status === "registered");

    // Step 5: open memberB's pending thread by URL.
    const page = await pageAs("memberA");
    // The thread page has a loading.tsx, so Next.js streams a 200 before notFound()
    // runs; the not-found screen and the absence of the content are what matter.
    await page.goto(`/member/community/${created.threadId}`);
    const notFoundShown = await waitForText(page, "This page could not be found");
    const inSource = (await page.content()).includes("pending thread owned by memberB");
    ev.check(
      "5 memberB's pending thread hidden from memberA",
      "not-found screen; thread content not in page source",
      `${notFoundShown ? "not-found screen" : "page rendered"}; content ${inSource ? "IN page source" : "not in page source"}`,
      notFoundShown && !inSource,
    );
    await ev.screenshot(page, "memberA opens memberB pending thread");

    // Step 6: tier-upgrade requests list only memberA's.
    const res6 = await api.get("/api/member/tier-upgrade");
    const reqs: { id: string }[] = (await res6.json()).requests ?? [];
    const leaked = reqs.some((r) => r.id === created.tierRequestId);
    ev.check("6 tier-upgrade GET excludes memberB's request", "memberB's request not listed", `${res6.status()}, ${reqs.length} request(s), ${leaked ? "memberB's listed" : "memberB's not listed"}`, res6.status() === 200 && !leaked);

    // Step 7: the membership QR always identifies the caller.
    const res7 = await api.get(`/api/member/qr-token?memberId=${b.id}&userId=${b.id}`);
    const url = new URL((await res7.json()).verificationUrl);
    const token = url.searchParams.get("token") ?? "";
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString() || "{}");
    ev.check("7 QR token identifies memberA even when memberB's id is passed", `memberId = memberA (${a.id})`, `memberId = ${payload.memberId === a.id ? "memberA" : payload.memberId === b.id ? "memberB" : payload.memberId}`, payload.memberId === a.id);
  } finally {
    // Restore and clean up.
    await db().from("users").update({ designation: aProfileBefore?.designation }).eq("id", a.id);
    if (created.tierRequestId) await db().from("tier_upgrade_requests").delete().eq("id", created.tierRequestId);
    if (created.threadId) await db().from("discussion").delete().eq("id", created.threadId);
    if (created.eventId) await deleteEvent(created.eventId);
    if (created.notificationId) await db().from("notifications").delete().eq("id", created.notificationId);
  }

  expect(ev.passed, "all TC-SFR-02 checks pass").toBe(true);
});
