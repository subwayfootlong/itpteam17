import { readJsonObject, invalidInput, InputValidationError, isUuid, isOneOf } from "@/lib/inputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import {
  formatTierLabel,
  getAvailableTierUpgrades,
} from "@/lib/membershipTiers";
import { formatMemberName } from "@/lib/memberName";
import { supabaseAdmin } from "@/lib/supabaseServer";

type TierRequestRow = {
  id: string;
  user_id: string;
  current_tier: string;
  requested_tier: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function GET(req: Request) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const status = new URL(req.url).searchParams.get("status");
  if (status && !isOneOf(status, ["pending", "approved", "rejected"])) return invalidInput("Invalid status filter");
  let query = supabaseAdmin
    .from("tier_upgrade_requests")
    .select("id, user_id, current_tier, requested_tier, reason, status, admin_note, reviewed_by, reviewed_at, created_at")
    .order("created_at", { ascending: false });

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }

  const requests = (data ?? []) as TierRequestRow[];
  const userIds = [...new Set(requests.flatMap((request) => [request.user_id, request.reviewed_by].filter(Boolean) as string[]))];
  const { data: users, error: userError } = userIds.length
    ? await supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, email, member_id")
        .in("id", userIds)
    : { data: [], error: null };

  if (userError) {
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }

  const usersById = new Map((users ?? []).map((user) => [String(user.id), user]));
  return NextResponse.json({
    requests: requests.map((request) => {
      const member = usersById.get(request.user_id);
      const reviewer = request.reviewed_by ? usersById.get(request.reviewed_by) : null;
      return {
        id: request.id,
        current_tier: request.current_tier,
        requested_tier: request.requested_tier,
        reason: request.reason,
        status: request.status,
        admin_note: request.admin_note,
        reviewed_at: request.reviewed_at,
        created_at: request.created_at,
        member: member
          ? {
              id: member.id,
              name: formatMemberName(member),
              email: member.email,
              memberId: member.member_id,
            }
          : null,
        reviewerName: reviewer ? formatMemberName(reviewer, "Administrator") : null,
      };
    }),
  });
}

export async function PATCH(req: Request) {
  const { user: admin, response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  let body: unknown;
  try {
    body = await readJsonObject(req);
  } catch (error) {
    return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
  }

  const payload = body as { id?: unknown; action?: unknown; adminNote?: unknown };
  if (!isUuid(payload.id) || !isOneOf(payload.action, ["approve", "reject"])) {
    return NextResponse.json({ error: "Request id and a valid action are required" }, { status: 400 });
  }

  if (payload.adminNote != null && typeof payload.adminNote !== "string") return invalidInput("Admin note must be a string");
  const adminNote = typeof payload.adminNote === "string" ? payload.adminNote.trim() : "";
  if (adminNote.length > 1000) {
    return NextResponse.json({ error: "Admin note must be 1,000 characters or fewer" }, { status: 400 });
  }
  if (payload.action === "reject" && !adminNote) {
    return NextResponse.json(
      { error: "Add an admin note before rejecting this request" },
      { status: 400 },
    );
  }

  const { data: request, error: requestError } = await supabaseAdmin
    .from("tier_upgrade_requests")
    .select("id, user_id, current_tier, requested_tier, status")
    .eq("id", payload.id)
    .maybeSingle();

  if (requestError || !request) {
    return NextResponse.json({ error: "Tier request not found" }, { status: 404 });
  }
  if (request.status !== "pending") {
    return NextResponse.json({ error: "This request has already been reviewed" }, { status: 409 });
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("users")
    .select("id, membership_tier")
    .eq("id", request.user_id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json({ error: "Member record not found" }, { status: 404 });
  }

  if (payload.action === "approve") {
    const stillAvailable = getAvailableTierUpgrades(member.membership_tier)
      .some((tier) => tier.value === request.requested_tier);
    if (!stillAvailable) {
      return NextResponse.json(
        { error: "The member's tier changed after this request was submitted. Reject this stale request instead." },
        { status: 409 },
      );
    }
  }

  const nextStatus = payload.action === "approve" ? "approved" : "rejected";
  const reviewedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("tier_upgrade_requests")
    .update({
      status: nextStatus,
      admin_note: adminNote || null,
      reviewed_by: admin.sub,
      reviewed_at: reviewedAt,
      updated_at: reviewedAt,
    })
    .eq("id", request.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (claimError) {
    return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
  }
  if (!claimed) {
    return NextResponse.json({ error: "This request has already been reviewed" }, { status: 409 });
  }

  if (nextStatus === "approved") {
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ membership_tier: request.requested_tier })
      .eq("id", request.user_id);

    if (updateError) {
      await supabaseAdmin
        .from("tier_upgrade_requests")
        .update({ status: "pending", admin_note: null, reviewed_by: null, reviewed_at: null, updated_at: reviewedAt })
        .eq("id", request.id)
        .eq("status", "approved");
      return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
    }
  }

  await supabaseAdmin.from("notifications").upsert(
    {
      user_id: request.user_id,
      type: "System",
      priority: "High",
      title: nextStatus === "approved" ? "Tier upgrade approved" : "Tier upgrade request reviewed",
      message: nextStatus === "approved"
        ? `Your membership has been upgraded to ${formatTierLabel(request.requested_tier)}.`
        : `Your request to upgrade to ${formatTierLabel(request.requested_tier)} was not approved.${adminNote ? ` ${adminNote}` : ""}`,
      action_label: "View membership",
      action_href: "/member/profile",
      source_type: "tier_upgrade_request",
      source_id: request.id,
      is_read: false,
      is_deleted: false,
      created_at: reviewedAt,
    },
    { onConflict: "user_id,source_type,source_id" },
  );

  return NextResponse.json({ ok: true, status: nextStatus });
}
