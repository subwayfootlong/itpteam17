import { supabaseAdmin } from "./supabaseServer";
import type {
  Partner,
} from "@/lib/data/partners";

type BenefitRow = {
  id: string | number;
  merchant_name: string | null;
  category: string | null;
  discount_description: string | null;
  discount_amount: string | number | null;
  address: string | null;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  logo_initials: string | null;
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isOnlineBenefit(address: string | null) {
  const normalized = address?.trim().toLowerCase();
  return !normalized || normalized.includes("online");
}

function buildOffer(row: BenefitRow) {
  const description = row.discount_description?.trim();
  const amount =
    row.discount_amount === null || row.discount_amount === undefined
      ? ""
      : String(row.discount_amount).trim();

  if (description && amount && !description.includes(amount)) {
    return `${amount} ${description}`;
  }

  return description || amount || "Exclusive Pergas member reward";
}

function mapBenefit(row: BenefitRow): Partner {
  const name = row.merchant_name?.trim() || "Pergas Partner";
  const address = row.address?.trim() || "Online or merchant-confirmed redemption";
  const online = isOnlineBenefit(row.address);

  return {
    id: String(row.id),
    name,
    initials: row.logo_initials?.trim() || initialsFromName(name),
    category: row.category?.trim() || "Other",
    region: online ? "Online" : "Singapore",
    offer: buildOffer(row),
    description:
      row.description?.trim() ||
      `${name} is an admin-listed Friends of Pergas benefit partner.`,
    address,
    distance: online ? "Online benefit" : "Singapore location",
    terms:
      row.discount_description?.trim() ||
      "Present an active Pergas membership when redeeming. Merchant terms and availability may apply.",
    imageUrl: row.image_url?.trim() || undefined,
    logoUrl: row.logo_url?.trim() || undefined,
  };
}

export async function getActiveBenefitPartners(): Promise<Partner[]> {
  const { data, error } = await supabaseAdmin
    .from("benefits")
    .select(
      "id, merchant_name, category, discount_description, discount_amount, address, description, image_url, logo_url, logo_initials",
    )
    .eq("is_active", true)
    .order("merchant_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BenefitRow[]).map(mapBenefit);
}
