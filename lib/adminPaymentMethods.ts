import { supabaseAdmin } from "./supabaseServer";

export type AdminPaymentMethod = {
  id: string;
  name: string;
  description: string | null;
  paynow_uen: string | null;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: string | null;
};

export const ADMIN_PAYMENT_METHOD_SELECT =
  "id, name, description, paynow_uen, qr_code_url, is_active, created_at";

export async function getAdminPaymentMethods(): Promise<AdminPaymentMethod[]> {
  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .select(ADMIN_PAYMENT_METHOD_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminPaymentMethod[];
}
