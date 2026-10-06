import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import {
  formatTierLabel,
  getAvailableTierUpgrades,
  isMembershipTier,
} from "@/lib/membershipTiers";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("users")
    .select("membership_tier")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json({ error: "Member record not found" }, { status: 404 });
  }

  const { data: requests, error } = await supabaseAdmin
    .from("tier_upgrade_requests")
    .select("id, current_tier, requested_tier, reason, status, admin_note, reviewed_at, created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    currentTier: member.membership_tier,
    availableTiers: getAvailableTierUpgrades(member.membership_tier),
    requests: requests ?? [],
  });
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload = body as { requestedTier?: unknown; reason?: unknown };
  if (!isMembershipTier(payload.requestedTier)) {
    return NextResponse.json({ error: "Select a valid membership tier" }, { status: 400 });
  }

  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "Please provide a reason for your request" }, { status: 400 });
  }
  if (reason.length > 1000) {
    return NextResponse.json({ error: "Reason must be 1,000 characters or fewer" }, { status: 400 });
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("users")
    .select("membership_tier, membership_status")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json({ error: "Member record not found" }, { status: 404 });
  }
  if (member.membership_status !== "active") {
    return NextResponse.json(
      { error: "Only active members can request a tier upgrade" },
      { status: 403 },
    );
  }

  const availableTiers = getAvailableTierUpgrades(member.membership_tier);
  if (!availableTiers.some((tier) => tier.value === payload.requestedTier)) {
    return NextResponse.json(
      {
        error: `${formatTierLabel(payload.requestedTier)} is not an available upgrade from ${formatTierLabel(member.membership_tier)}`,
      },
      { status: 400 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("tier_upgrade_requests")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have a pending tier upgrade request" },
      { status: 409 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tier_upgrade_requests")
    .insert({
      user_id: currentUser.id,
      current_tier: member.membership_tier,
      requested_tier: payload.requestedTier,
      reason,
    })
    .select("id, current_tier, requested_tier, reason, status, created_at")
    .single();

  if (error) {
    const message = error.code === "23505"
      ? "You already have a pending tier upgrade request"
      : error.message;
    return NextResponse.json({ error: message }, { status: error.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ request: data }, { status: 201 });
}
