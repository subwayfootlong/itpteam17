import MemberPageShell from "@/components/member/MemberPageShell";
import BenefitsDirectory from "@/components/member/BenefitsDirectory";
import { getCurrentUser } from "@/lib/currentUser";
import type { Partner } from "@/lib/data/partners";
import { getActiveBenefitPartners } from "@/lib/benefits";
import { formatTierLabel } from "@/lib/membershipTiers";

export const dynamic = "force-dynamic";

export default async function BenefitPage() {
  const user = await getCurrentUser();
  let visiblePartners: Partner[] = [];

  try {
    visiblePartners = await getActiveBenefitPartners();
  } catch (error) {
    console.warn("Unable to load benefit data:", error);
  }

  return (
    <MemberPageShell>
      <BenefitsDirectory
        partners={visiblePartners}
        showChrome={false}
        member={{
          firstName: user?.firstName ?? "",
          lastName: user?.lastName ?? "",
          membershipTierLabel: formatTierLabel(user?.membershipTier),
          initials: user?.initials ?? "M",
        }}
      />
    </MemberPageShell>
  );
}
