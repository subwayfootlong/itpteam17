import BenefitsDirectory from "../components/benefits-directory";
import { membershipBenefits, partners } from "../data/partners";
import { getActiveBenefitPartners } from "@/lib/benefits";

export const dynamic = "force-dynamic";

export default async function BenefitPage() {
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
    <BenefitsDirectory
      partners={visiblePartners}
      membershipBenefits={membershipBenefits}
    />
  );
}
