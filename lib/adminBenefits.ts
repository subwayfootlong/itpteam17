import { supabaseAdmin } from "./supabaseServer";

export type AdminBenefit = {
  id: string;
  merchant_name: string;
  category: string;
  discount_description: string;
  discount_amount: string | number | null;
  address: string | null;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  logo_initials: string | null;
  is_active: boolean;
  created_at: string | null;
  audience_type: "all" | "selected_tiers";
  eligible_tiers: string[];
  show_locked_preview: boolean;
};

export const ADMIN_BENEFIT_SELECT =
  "id, merchant_name, category, discount_description, discount_amount, address, description, image_url, logo_url, logo_initials, is_active, created_at, audience_type, eligible_tiers, show_locked_preview";

export async function getAdminBenefits(): Promise<AdminBenefit[]> {
  const { data, error } = await supabaseAdmin
    .from("benefits")
    .select(ADMIN_BENEFIT_SELECT)
    .order("merchant_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as AdminBenefit[];
}
