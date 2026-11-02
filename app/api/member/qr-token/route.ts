import { requireMember } from "@/lib/currentUser";
import { logServerError } from "@/lib/serverErrors";
import { generateMembershipQrToken, membershipVerificationUrl, MEMBERSHIP_QR_TTL, qrResponseHeaders } from "@/lib/membershipQr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: qrResponseHeaders });
  try {
    const { user, response } = await requireMember();
    if (response) return respond({ error: response.status === 403 ? "Forbidden" : "Unauthorized" }, response.status);
    // member_id is optional and can contain a phone number. Use the stable record ID.
    const signed = generateMembershipQrToken(user.id);
    return respond({ verificationUrl: membershipVerificationUrl(signed, request.url), expiresIn: MEMBERSHIP_QR_TTL });
  } catch (caughtError) {
    logServerError("app/api/member/qr-token/route.GET", caughtError);
    return respond({ error: "Unable to generate membership QR. Please try again." }, 503);
  }
}
