import PaymentMethodManagementPanel from "@/components/admin/PaymentMethodManagementPanel";
import { getAdminPaymentMethods } from "@/lib/adminPaymentMethods";
import type { AdminPaymentMethod } from "@/lib/adminPaymentMethods";

export const dynamic = "force-dynamic";

export default async function PaymentMethodManagementPage() {
  let paymentMethods: AdminPaymentMethod[] = [];
  let loadError: string | undefined;

  try {
    paymentMethods = await getAdminPaymentMethods();
  } catch (error) {
    loadError =
      error instanceof Error
        ? `Failed to load payment methods: ${error.message}`
        : "Failed to load payment methods.";
  }

  return (
    <PaymentMethodManagementPanel
      initialPaymentMethods={paymentMethods}
      loadError={loadError}
    />
  );
}
