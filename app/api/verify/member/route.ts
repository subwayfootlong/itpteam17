import { supabaseAdmin } from "@/lib/supabaseServer";
import { qrResponseHeaders, verifyMembershipQrToken } from "@/lib/membershipQr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: qrResponseHeaders });
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return respond({ valid: false, code: "invalid", error: "Invalid Membership QR" }, 400);
    const result = verifyMembershipQrToken(token);
    if (!result.valid) return respond({ valid: false, code: result.code, error: result.code === "expired" ? "QR Expired" : "Invalid Membership QR" }, 400);
    const { data, error } = await supabaseAdmin.from("users")
      .select("first_name, last_name, membership_tier, membership_status, expiry_date")
      .eq("id", result.memberId).maybeSingle();
    if (error) return respond({ valid: false, code: "unavailable", error: "Unable to verify membership. Please try again." }, 503);
    if (!data) return respond({ valid: false, code: "invalid", error: "Invalid Membership QR" }, 404);
    const first = data.first_name?.trim().split(/\s+/)[0] || "Member";
    const initial = Array.from((data.last_name?.trim() || "") as string)[0];
    return respond({ valid: true, member: {
      displayName: initial ? `${first} ${initial}.` : first,
      membershipTier: data.membership_tier,
      membershipStatus: data.membership_status,
      expiryDate: data.expiry_date,
    } });
  } catch {
    return respond({ valid: false, code: "unavailable", error: "Unable to verify membership. Please try again." }, 503);
  }
}
