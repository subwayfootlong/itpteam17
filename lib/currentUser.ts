import { cookies } from "next/headers";
import { verifyAccessToken } from "./auth";
import { supabaseAdmin } from "./supabaseServer";
import { formatMemberName } from "./memberName";

type TokenPayload = {
  sub?: string;
  email?: string;
};

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const payload = verifyAccessToken(token) as TokenPayload;
    if (!payload.sub) return null;

    const { data } = await supabaseAdmin
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("id", payload.sub)
      .maybeSingle();

    if (!data) {
      return {
        id: payload.sub,
        email: payload.email ?? null,
        fullName: payload.email ?? "Member",
      };
    }

    return {
      id: String(data.id),
      email: data.email ?? null,
      fullName: formatMemberName(data),
    };
  } catch {
    return null;
  }
}
