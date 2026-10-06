import ChangePasswordForm from "@/components/member/ChangePasswordForm";
import MemberPageShell from "@/components/member/MemberPageShell";
import { getCurrentUser } from "@/lib/currentUser";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    notFound();
  }

  return (
    <MemberPageShell showTopBar={false}>
      <ChangePasswordForm />
    </MemberPageShell>
  );
}
