import BenefitManagementPanel from "@/components/admin/BenefitManagementPanel";
import { getAdminBenefits } from "@/lib/adminBenefits";
import type { AdminBenefit } from "@/lib/adminBenefits";

export const dynamic = "force-dynamic";

export default async function BenefitManagementPage() {
  let benefits: AdminBenefit[] = [];
  let loadError: string | undefined;

  try {
    benefits = await getAdminBenefits();
  } catch (error) {
    loadError =
      error instanceof Error
        ? `Failed to load benefits: ${error.message}`
        : "Failed to load benefits.";
  }

  return <BenefitManagementPanel initialBenefits={benefits} loadError={loadError} />;
}
