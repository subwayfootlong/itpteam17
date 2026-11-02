import { unexpectedApiError } from "@/lib/serverErrors";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { clearSessionCookies, setLastActivityCookie } from "@/lib/session";

export async function POST() {
  try {
    if (!(await getCurrentUser())) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      clearSessionCookies(res);
      return res;
    }
    const res = NextResponse.json({ ok: true });
    setLastActivityCookie(res); // Compatibility hint only; never trusted by the server.
    return res;
  } catch (error) {
    return unexpectedApiError("app/api/auth/activity/route.POST", error);
  }
}
