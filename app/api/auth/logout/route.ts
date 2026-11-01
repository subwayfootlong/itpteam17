import { unexpectedApiError } from "@/lib/serverErrors";
import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    clearSessionCookies(res);
    return res;
  } catch (error) {
    return unexpectedApiError("app/api/auth/logout/route.POST", error);
  }
}