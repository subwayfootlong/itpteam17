import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookies } from "@/lib/session";
import { validateSession } from "@/lib/sessionServer";
import { logServerError } from "@/lib/serverErrors";

export async function proxy(request: NextRequest) {
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
  matcher: ["/member/:path*", "/admin/:path*"],
};
