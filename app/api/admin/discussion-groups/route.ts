import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { tierAudienceToDatabase, validateTierAudience } from "@/lib/tierAccess";
import { getVerifiedAdmin, unauthorizedResponse } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const GROUP_SELECT =
  "id, title, icon, tone, sort_order, audience_type, eligible_tiers, show_locked_preview";

export async function GET() {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();
  const { data, error } = await supabaseAdmin
    .from("discussion_groups")
    .select(GROUP_SELECT)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ groups: data ?? [] });
}

export async function PATCH(req: Request) {
  const admin = await getVerifiedAdmin();
  if (!admin) return unauthorizedResponse();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "Discussion group ID is required." }, { status: 400 });
  }

  const audience = validateTierAudience(body);
  if (!audience.ok) {
    return NextResponse.json({ error: audience.error }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("discussion_groups")
    .update({
      ...tierAudienceToDatabase(audience.value),
      // Community spaces are private when restricted; previews stay disabled.
      show_locked_preview: false,
    })
    .eq("id", id)
    .select(GROUP_SELECT)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Discussion group not found." }, { status: 404 });
  }

  return NextResponse.json({ group: data });
}
