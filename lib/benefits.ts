import { supabaseAdmin } from "./supabaseServer";
import type {
  Partner,
  PartnerCategory,
  SingaporeRegion,
} from "@/app/data/partners";

type BenefitRow = {
  id: string | number;
  merchant_name: string | null;
  category: string | null;
  discount_description: string | null;
  discount_amount: string | number | null;
  address: string | null;
  description: string | null;
  logo_initials: string | null;
  is_active: boolean | null;
  created_at: string | null;
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

function mapCategory(category: string | null): PartnerCategory {
  const normalized = (category ?? "").toLowerCase();

  if (
    normalized.includes("book") ||
    normalized.includes("learn") ||
    normalized.includes("education") ||
    normalized.includes("workshop")
  ) {
    return "Books & Learning";
  }

  return "Lifestyle";
}

function mapRegion(address: string | null): SingaporeRegion | "Online" {
  if (!address) return "Online";

  const normalized = address.toLowerCase();
  if (
    normalized.includes("tampines") ||
    normalized.includes("bedok") ||
    normalized.includes("pasir ris") ||
    normalized.includes("joo chiat") ||
    normalized.includes("east")
  ) {
    return "East";
  }

  if (
    normalized.includes("jurong") ||
    normalized.includes("clementi") ||
    normalized.includes("bukit batok") ||
    normalized.includes("west")
  ) {
    return "West";
  }

  if (
    normalized.includes("yishun") ||
    normalized.includes("woodlands") ||
    normalized.includes("sembawang") ||
    normalized.includes("north")
  ) {
    return "North";
  }

  return "Central";
}

function hashToMapPosition(seed: string): { x: number; y: number } {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return {
    x: 22 + (hash % 62),
    y: 24 + ((hash >> 8) % 42),
  };
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

function mapBenefit(row: BenefitRow, index: number): Partner {
  const name = row.merchant_name?.trim() || "Pergas Partner";
  const address = row.address?.trim() || "Online or merchant-confirmed redemption";
  const region = mapRegion(row.address);
  const category = mapCategory(row.category);
  const hasPhysicalAddress = Boolean(row.address?.trim());

  return {
    id: String(row.id),
    name,
    initials: row.logo_initials?.trim() || initialsFromName(name),
    category,
    region,
    offer: buildOffer(row),
    description:
      row.description?.trim() ||
      `${name} is an admin-listed Friends of Pergas benefit partner.`,
    address,
    distance: region === "Online" ? "Online benefit" : `${region} Singapore`,
    terms:
      row.discount_description?.trim() ||
      "Present an active Pergas membership when redeeming. Merchant terms and availability may apply.",
    website: `https://www.google.com/search?q=${encodeURIComponent(name)}`,
    featured: index < 2,
    mapPosition: hasPhysicalAddress
      ? hashToMapPosition(`${name}:${address}`)
      : undefined,
  };
}

export async function getActiveBenefitPartners(): Promise<Partner[]> {
  const { data, error } = await supabaseAdmin
    .from("benefits")
    .select(
      "id, merchant_name, category, discount_description, discount_amount, address, description, logo_initials, is_active, created_at",
    )
    .eq("is_active", true)
    .order("merchant_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BenefitRow[]).map(mapBenefit);
}
