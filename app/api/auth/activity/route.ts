import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import {
  clearSessionCookies,
  getLastActivityTimestamp,
  isSessionIdleExpired,
  LAST_ACTIVITY_COOKIE,
  setLastActivityCookie,
} from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  // Session activity intentionally supports both member and admin accounts.
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lastActivity = getLastActivityTimestamp(
    cookieStore.get(LAST_ACTIVITY_COOKIE)?.value,
  );

  if (lastActivity !== null && isSessionIdleExpired(lastActivity)) {
    const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
    clearSessionCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  setLastActivityCookie(res);
  return res;
}
