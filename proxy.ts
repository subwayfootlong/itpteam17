import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  clearSessionCookies,
  getLastActivityTimestamp,
  isSessionIdleExpired,
  LAST_ACTIVITY_COOKIE,
} from "@/lib/session";
import { isSameOriginMutation } from "@/lib/requestSecurity";

const INTERNAL_BEARER_ROUTES = new Set([
  "/api/internal/email-change-notifications",
  "/api/internal/transactional-emails",
]);

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    const isInternalWorker = INTERNAL_BEARER_ROUTES.has(pathname);
    if (!isInternalWorker && !isSameOriginMutation(request)) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403, headers: { "Cache-Control": "no-store", Vary: "Origin" } },
      );
    }
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/?screen=login", request.url));
  }

  const lastActivity = getLastActivityTimestamp(
    request.cookies.get(LAST_ACTIVITY_COOKIE)?.value,
  );

  if (lastActivity === null) {
    const response = NextResponse.redirect(new URL("/?screen=login", request.url));
    clearSessionCookies(response);
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
  matcher: ["/member/:path*", "/admin/:path*", "/api/:path*"],
};
