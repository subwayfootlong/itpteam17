import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { clearSessionCookies, isSessionRevoked, SESSION_COOKIE, sessionId, withSessionRevoked } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { logServerError } from "@/lib/serverLog";

export async function POST() {
  await revokeSession((await cookies()).get(SESSION_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}

// SFR-06 / DEF-03: clearing the browser's cookies is not enough, because a copied
// token would stay valid until it expires. Recording this session's ID as revoked
// makes getCurrentUser() reject it; the member's other devices stay signed in.
async function revokeSession(token: string | undefined) {
  if (!token) return;
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return; // Expired or forged: there is nothing valid to revoke.
  }
  if (typeof payload === "string" || typeof payload.sub !== "string" || typeof payload.exp !== "number") return;
  const id = sessionId(payload);
  if (!id) return; // Issued before session IDs existed; expires on its own within 7 days.

  // Read-modify-write guarded on the list being unchanged, so two devices logging
  // out at the same moment can't overwrite each other's entry. Retries a few times.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("revoked_sessions")
      .eq("id", payload.sub)
      .maybeSingle();
    if (error) {
      logServerError("auth/logout POST", error);
      return;
    }
    if (!data || isSessionRevoked(payload, data.revoked_sessions)) return;

    const current: string[] = data.revoked_sessions ?? [];
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("users")
      .update({ revoked_sessions: withSessionRevoked(current, id, payload.exp) })
      .eq("id", payload.sub)
      .filter("revoked_sessions", "eq", `{${current.join(",")}}`)
      .select("id");
    if (updateError) {
      logServerError("auth/logout POST", updateError);
      return;
    }
    if (updated?.length) return;
  }
  logServerError("auth/logout POST", { code: "CONFLICT" });
}
