import { NextResponse } from "next/server";
import { getAuthorizedUser, type AuthorizationResult } from "./currentUser";
import { formatMemberName } from "./memberName";

export type VerifiedAdmin = {
  sub: string;
  email: string | null;
  fullName: string;
};

export async function requireAdmin(): Promise<AuthorizationResult<VerifiedAdmin>> {
  const result = await getAuthorizedUser("admin");
  if (result.response) return { response: result.response };
  return {
    user: {
      sub: result.user.id,
      email: result.user.email,
      fullName: formatMemberName({ first_name: result.user.firstName, last_name: result.user.lastName, email: result.user.email }, "Admin"),
    },
  };
}

// Preserve the nullable helper for existing page/layout consumers.
export async function getVerifiedAdmin(): Promise<VerifiedAdmin | null> {
  const result = await requireAdmin();
  return result.user ?? null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
