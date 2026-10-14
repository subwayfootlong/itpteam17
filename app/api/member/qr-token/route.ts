import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { generateMembershipQrToken, membershipVerificationUrl, MEMBERSHIP_QR_TTL, qrResponseHeaders } from "@/lib/membershipQr";
import { getLastActivityTimestamp, isSessionIdleExpired, LAST_ACTIVITY_COOKIE } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: qrResponseHeaders });
  try {
    const store = await cookies();
    const token = store.get("token")?.value;
    const lastActivity = getLastActivityTimestamp(store.get(LAST_ACTIVITY_COOKIE)?.value);
    if (!token || (lastActivity !== null && isSessionIdleExpired(lastActivity))) {
      return respond({ error: "Unauthorized" }, 401);
    }
    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      if (typeof payload === "string" || typeof payload.sub !== "string" || !payload.sub) {
        return respond({ error: "Unauthorized" }, 401);
      }
      userId = payload.sub;
    } catch {
      return respond({ error: "Unauthorized" }, 401);
    }
    const { data, error } = await supabaseAdmin.from("users").select("id").eq("id", userId).maybeSingle();
    if (error) return respond({ error: "Unable to generate membership QR. Please try again." }, 503);
    if (!data?.id) return respond({ code: "member_not_found", error: "Membership record unavailable" }, 404);
    // member_id is optional and can contain a phone number. Use the stable record ID.
    const signed = generateMembershipQrToken(data.id);
    return respond({ verificationUrl: membershipVerificationUrl(signed, request.url), expiresIn: MEMBERSHIP_QR_TTL });
  } catch {
    return respond({ error: "Unable to generate membership QR. Please try again." }, 503);
  }
}
