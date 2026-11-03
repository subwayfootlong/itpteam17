import { NextResponse } from "next/server";
import {
  getSessionCookieOptions,
  LAST_ACTIVITY_COOKIE,
  SESSION_COOKIE,
} from "./sessionPolicy";

export * from "./sessionPolicy";

export function setLastActivityCookie(
  res: NextResponse,
  timestamp = Date.now(),
) {
  res.cookies.set(LAST_ACTIVITY_COOKIE, String(timestamp), {
    ...getSessionCookieOptions(),
  });
}

export function setSessionCookies(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
  setLastActivityCookie(res);
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  res.cookies.set(LAST_ACTIVITY_COOKIE, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
