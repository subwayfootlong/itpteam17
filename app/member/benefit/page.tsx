import MemberBottomNav from "@/components/MemberBottomNav";
import MemberTopBar from "@/components/MemberTopBar";
import BenefitsDirectory from "../../components/benefits-directory";
import { membershipBenefits, partners } from "../../data/partners";
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
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        <MemberTopBar />

        <BenefitsDirectory
          partners={visiblePartners}
          membershipBenefits={membershipBenefits}
          showChrome={false}
        />

        <MemberBottomNav />
      </section>
    </main>
  );
}
