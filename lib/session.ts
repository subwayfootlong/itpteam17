import { NextResponse } from "next/server";

export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const LAST_ACTIVITY_COOKIE = "last_activity";
export const LOGOUT_LOGIN_HINT_KEY = "pergas:show-login-after-logout";

export function getLastActivityTimestamp(
  cookieValue: string | undefined,
): number | null {
  if (!cookieValue) return null;

  const parsed = Number(cookieValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isSessionIdleExpired(lastActivity: number): boolean {
  return Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS;
}

export function setLastActivityCookie(
  res: NextResponse,
  timestamp = Date.now(),
) {
  res.cookies.set(LAST_ACTIVITY_COOKIE, String(timestamp), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set("token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  res.cookies.set(LAST_ACTIVITY_COOKIE, "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
