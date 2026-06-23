import MemberPageShell from "@/components/member/MemberPageShell";
import BenefitsDirectory from "@/components/member/BenefitsDirectory";
import { getCurrentUser } from "@/lib/currentUser";
import { membershipBenefits, partners } from "@/lib/data/partners";
import { getActiveBenefitPartners } from "@/lib/benefits";
import { formatTierLabel } from "@/lib/membershipTiers";

export const dynamic = "force-dynamic";

export default async function BenefitPage() {
  const user = await getCurrentUser();
  let visiblePartners = partners;

  try {
    const adminPartners = await getActiveBenefitPartners();
    if (adminPartners.length > 0) {
      visiblePartners = adminPartners;
    }
  } catch (error) {
    console.warn("Using benefit fallback data:", error);
  }

  return (
    <MemberPageShell>
      <BenefitsDirectory
        partners={visiblePartners}
        membershipBenefits={membershipBenefits}
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
