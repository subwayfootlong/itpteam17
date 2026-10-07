import { supabaseAdmin } from "./supabaseServer";

export type PublicPaymentMethod = {
  id: string;
  name: string;
  description: string | null;
  paynowUen: string | null;
  qrCodeUrl: string | null;
};

type PaymentMethodRow = {
  id: string;
  name: string | null;
  description: string | null;
  paynow_uen: string | null;
  qr_code_url: string | null;
};

function mapPaymentMethod(row: PaymentMethodRow): PublicPaymentMethod {
  return {
    id: String(row.id),
    name: row.name?.trim() || "Pergas Payment",
    description: row.description?.trim() || null,
    paynowUen: row.paynow_uen?.trim() || null,
    qrCodeUrl: row.qr_code_url?.trim() || null,
  };
}

export async function getActivePaymentMethods(): Promise<PublicPaymentMethod[]> {
  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .select("id, name, description, paynow_uen, qr_code_url")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as PaymentMethodRow[]).map(mapPaymentMethod);
}
