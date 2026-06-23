import { cookies } from "next/headers";
import { verifyAccessToken } from "./auth";
import { supabaseAdmin } from "./supabaseServer";
import { formatMemberName, memberInitials } from "./memberName";

type TokenPayload = {
  sub?: string;
  email?: string;
};

export type CurrentUser = {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  membershipTier: string | null;
  membershipStatus: string | null;
  expiryDate: string | null;
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
      .select(
        "id, email, first_name, last_name, membership_tier, membership_status, expiry_date",
      )
      .eq("id", payload.sub)
      .maybeSingle();

    if (!data) {
      const email = payload.email ?? null;
      return {
        id: payload.sub,
        email,
        firstName: "",
        lastName: "",
        fullName: email ?? "Member",
        initials: email?.charAt(0).toUpperCase() ?? "M",
        membershipTier: null,
        membershipStatus: null,
        expiryDate: null,
      };
    }

    const firstName = data.first_name?.trim() ?? "";
    const lastName = data.last_name?.trim() ?? "";

    return {
      id: String(data.id),
      email: data.email ?? null,
      firstName,
      lastName,
      fullName: formatMemberName(data),
      initials: memberInitials(data),
      membershipTier: data.membership_tier ?? null,
      membershipStatus: data.membership_status ?? null,
      expiryDate: data.expiry_date ?? null,
    };
  } catch {
    return null;
  }
}
