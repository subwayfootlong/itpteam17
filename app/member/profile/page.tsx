import { cookies } from "next/headers";
import ProfileView from "@/components/ProfileView";
import { verifyAccessToken } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseServer";

export type MemberProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  member_id: string | null;
  membership_tier: string | null;
  membership_status: string | null;
  expiry_date: string | null;
  phone: string | null;
  organization: string | null;
  designation: string | null;
  arabic_name: string | null;
  member_since: string | null;
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const payload = verifyAccessToken(token as string) as { sub: string };
  const userId = payload.sub;

  const { data: member, error } = await supabaseAdmin
    .from("users")
    .select(
      "id, first_name, last_name, email, role, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, arabic_name, member_since"
    )
    .eq("id", userId)
    .single();

  if (error || !member) {
    throw new Error("Unable to load member profile");
  }

  return <ProfileView member={member as MemberProfile} />;
}