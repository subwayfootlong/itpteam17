import { unexpectedApiError } from "@/lib/serverErrors";
import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";
import { cookies } from "next/headers";
import { revokeSession } from "@/lib/sessionServer";

export async function POST() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (token) await revokeSession(token);
    const res = NextResponse.json({ ok: true });
    clearSessionCookies(res);
    return res;
  } catch (error) {
    // Keep cookies on database failure so logout can be retried; never claim success.
    return unexpectedApiError("app/api/auth/logout/route.POST", error);
  }
}
