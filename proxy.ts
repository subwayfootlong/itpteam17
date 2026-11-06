import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  clearSessionCookies,
} from "@/lib/session";
import { validateSession } from "@/lib/sessionServer";
import { logServerError } from "@/lib/serverErrors";
import { isSameOriginMutation } from "@/lib/requestSecurity";

const INTERNAL_BEARER_ROUTES = new Set([
  "/api/internal/email-change-notifications",
  "/api/internal/transactional-emails",
]);

export async function proxy(request: NextRequest) {
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
  try {
    // Covers navigations where Next.js reuses a layout. The DAL and APIs also validate.
    if (token && await validateSession(token)) return NextResponse.next();
  } catch (error) {
    logServerError("proxy.session", error);
  }
  const response = NextResponse.redirect(new URL("/?screen=login", request.url));
  clearSessionCookies(response);
  return response;
}

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/api/:path*"],
};
