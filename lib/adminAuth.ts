import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";
import { formatMemberName } from "./memberName";
import { supabaseAdmin } from "./supabaseServer";

export type VerifiedAdmin = {
  sub: string;
  email: string | null;
  fullName: string;
};

export async function getVerifiedAdmin(): Promise<VerifiedAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const payload = verifyAccessToken(token) as { sub?: string; email?: string };
    if (!payload.sub) return null;

    const { data } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name, role")
      .eq("id", payload.sub)
      .maybeSingle();

    if (!data || data.role !== "admin") return null;

    return {
      sub: String(data.id),
      email: data.email ?? null,
      fullName: formatMemberName(data, "Admin"),
    };
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
