import MemberPageShell from "@/components/member/MemberPageShell";
import MemberPaymentView from "@/components/member/MemberPaymentView";
import { getCurrentUser } from "@/lib/currentUser";
import { getActivePaymentMethods } from "@/lib/paymentMethods";
import type { PublicPaymentMethod } from "@/lib/paymentMethods";

export const dynamic = "force-dynamic";

export default async function MemberPaymentPage() {
  const user = await getCurrentUser();
  let paymentMethods: PublicPaymentMethod[] = [];
  let loadError: string | undefined;

  try {
    paymentMethods = await getActivePaymentMethods();
  } catch (error) {
    loadError =
      error instanceof Error
        ? `Unable to load payment details: ${error.message}`
        : "Unable to load payment details.";
  }

  return (
    <MemberPageShell showTopBar={false}>
      <MemberPaymentView
        expiryDate={user?.expiryDate ?? null}
        paymentMethods={paymentMethods}
        loadError={loadError}
      />
    </MemberPageShell>
  );
}
