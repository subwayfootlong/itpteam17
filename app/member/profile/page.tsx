import MemberPageShell from "@/components/member/MemberPageShell";
import ProfileView from "@/components/ProfileView";
import { getCurrentUser } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

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

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  const { data: member, error } = await supabaseAdmin
    .from("users")
    .select(
      "id, first_name, last_name, email, role, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, arabic_name, member_since",
    )
    .eq("id", currentUser.id)
    .single();

  if (error || !member) {
    notFound();
  }

  return (
    <MemberPageShell>
      <ProfileView member={member as MemberProfile} />
    </MemberPageShell>
  );
}
