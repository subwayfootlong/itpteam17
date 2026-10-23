import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "./auth";
import { supabaseAdmin } from "./supabaseServer";
import { formatMemberName, memberInitials } from "./memberName";

type TokenPayload = {
  sub?: string;
  email?: string;
};

export type CurrentUser = {
  id: string;
  role: string | null;
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  phone: string | null;
  organization: string | null;
  membershipTier: string | null;
  membershipStatus: string | null;
  expiryDate: string | null;
  profileImageUrl: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const payload = verifyAccessToken(token) as TokenPayload;
    if (typeof payload.sub !== "string" || !payload.sub || typeof payload.email !== "string") return null;

    const { data } = await supabaseAdmin
      .from("users")
      .select(
        "id, email, role, first_name, last_name, phone, organization, membership_tier, membership_status, expiry_date, profile_image_url",
      )
      .eq("id", payload.sub)
      .maybeSingle();

    // Reject deleted users and JWTs issued before an email change.
    if (!data || payload.email !== data.email) return null;

    const firstName = data.first_name?.trim() ?? "";
    const lastName = data.last_name?.trim() ?? "";

    return {
      id: String(data.id),
      role: data.role ?? null,
      email: data.email ?? null,
      firstName,
      lastName,
      fullName: formatMemberName(data),
      initials: memberInitials(data),
      phone: data.phone?.trim() ?? null,
      organization: data.organization?.trim() ?? null,
      membershipTier: data.membership_tier ?? null,
      membershipStatus: data.membership_status ?? null,
      expiryDate: data.expiry_date ?? null,
      profileImageUrl: data.profile_image_url ?? null,
    };
  } catch {
    return null;
  }
}

export type AuthorizationResult<T> =
  | { user: T; response?: never }
  | { user?: never; response: NextResponse };

// Authenticate first, then enforce the current database role, never a JWT role.
export async function getAuthorizedUser(role: "admin" | "member"): Promise<AuthorizationResult<CurrentUser>> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== role) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export function requireMember() {
  return getAuthorizedUser("member");
}
