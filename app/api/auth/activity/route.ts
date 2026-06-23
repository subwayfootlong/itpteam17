import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import {
  clearSessionCookies,
  getLastActivityTimestamp,
  isSessionIdleExpired,
  LAST_ACTIVITY_COOKIE,
  setLastActivityCookie,
} from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    verifyAccessToken(token);
  } catch {
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
