import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  clearSessionCookies,
  getLastActivityTimestamp,
  isSessionIdleExpired,
  LAST_ACTIVITY_COOKIE,
  setLastActivityCookie,
} from "@/lib/session";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/?screen=login", request.url));
  }

  const lastActivity = getLastActivityTimestamp(
    request.cookies.get(LAST_ACTIVITY_COOKIE)?.value,
  );

  if (lastActivity === null) {
    const response = NextResponse.next();
    setLastActivityCookie(response);
    return response;
  }

  if (isSessionIdleExpired(lastActivity)) {
    const response = NextResponse.redirect(
      new URL("/?screen=login", request.url),
    );
    clearSessionCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*"],
};
