import { redirect } from "next/navigation";
import MemberPageShell from "@/components/member/MemberPageShell";
import TierUpgradeRequestView from "@/components/member/TierUpgradeRequestView";
import { getCurrentUser } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function TierUpgradePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/?screen=login");

  return (
    <MemberPageShell>
      <TierUpgradeRequestView />
    </MemberPageShell>
  );
}
