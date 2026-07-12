import MemberPageShell from "@/components/member/MemberPageShell";
import ProfileView from "@/components/ProfileView";
import { getCurrentUser } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

export type MemberProfile = {
  id: string;
  salutation: string | null;
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
  profile_image_url: string | null;
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
      "id, salutation, first_name, last_name, email, role, member_id, membership_tier, membership_status, expiry_date, phone, organization, designation, arabic_name, member_since, profile_image_url",
    )
    .eq("id", currentUser.id)
    .single();

  if (error || !member) {
    notFound();
  }

  // Fetch user's event registration history
  const { data: registrations } = await supabaseAdmin
    .from("event_registrations")
    .select(`
      id,
      registered_at,
      status,
      rejection_message,
      event_id,
      events (
        id,
        title,
        venue,
        event_date
      )
    `)
    .eq("user_id", currentUser.id)
    .order("registered_at", { ascending: false });

  return (
    <MemberPageShell>
      <ProfileView 
        member={member as MemberProfile} 
        registrations={registrations || []} 
      />
    </MemberPageShell>
  );
}
