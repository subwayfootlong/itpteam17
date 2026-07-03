import MemberPageShell from "@/components/member/MemberPageShell";
import EditProfileForm from "@/components/member/EditProfileForm";
import { getCurrentUser } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  const { data: member, error } = await supabaseAdmin
    .from("users")
    .select(
      "salutation, first_name, last_name, arabic_name, phone, organization, designation",
    )
    .eq("id", currentUser.id)
    .single();

  if (error || !member) {
    notFound();
  }

  return (
    <MemberPageShell showTopBar={false}>
      <EditProfileForm initial={member} />
    </MemberPageShell>
  );
}
