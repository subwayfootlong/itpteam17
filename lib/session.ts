import { NextResponse } from "next/server";

export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const LAST_ACTIVITY_COOKIE = "last_activity";
export const LOGOUT_LOGIN_HINT_KEY = "pergas:show-login-after-logout";
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setLastActivityCookie(
  res: NextResponse,
  timestamp = Date.now(),
) {
  res.cookies.set(LAST_ACTIVITY_COOKIE, String(timestamp), {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set("token", "", {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(0),
    maxAge: 0,
  });

  res.cookies.set(LAST_ACTIVITY_COOKIE, "", {
    ...SESSION_COOKIE_OPTIONS,
    expires: new Date(0),
    maxAge: 0,
  });
}
