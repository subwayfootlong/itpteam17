import { supabaseAdmin } from "./supabaseServer";
import type {
  Partner,
} from "@/lib/data/partners";
import {
  evaluateTierAccess,
  normalizeTierAudience,
  type MemberAccessContext,
  type TierAccessResult,
} from "./tierAccess";

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
  audience_type: string | null;
  eligible_tiers: string[] | null;
  show_locked_preview: boolean | null;
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

function mapBenefit(row: BenefitRow, access: TierAccessResult): Partner {
  const name = row.merchant_name?.trim() || "Pergas Partner";
  const address = row.address?.trim() || "Online or merchant-confirmed redemption";
  const online = isOnlineBenefit(row.address);

  return {
    id: String(row.id),
    name,
    initials: row.logo_initials?.trim() || initialsFromName(name),
    category: row.category?.trim() || "Other",
    region: online ? "Online" : "Singapore",
    offer: access.canAccess
      ? buildOffer(row)
      : `Available to ${access.requiredTierLabels.join(" and ")} members`,
    description: access.canAccess
      ? row.description?.trim() ||
        `${name} is an admin-listed Friends of Pergas benefit partner.`
      : "This reward is reserved for eligible membership tiers.",
    address: access.canAccess ? address : "Restricted member reward",
    distance: online ? "Online benefit" : "Singapore location",
    terms: access.canAccess
      ? row.discount_description?.trim() ||
        "Present an active Pergas membership when redeeming. Merchant terms and availability may apply."
      : "Upgrade or renew your membership to access this reward.",
    imageUrl: row.image_url?.trim() || undefined,
    logoUrl: row.logo_url?.trim() || undefined,
    isLocked: !access.canAccess,
    requiredTierLabels: access.requiredTierLabels,
  };
}

export async function getActiveBenefitPartners(
  member: MemberAccessContext,
): Promise<Partner[]> {
  const { data, error } = await supabaseAdmin
    .from("benefits")
    .select(
      "id, merchant_name, category, discount_description, discount_amount, address, description, image_url, logo_url, logo_initials, audience_type, eligible_tiers, show_locked_preview",
    )
    .eq("is_active", true)
    .order("merchant_name", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as BenefitRow[])
    .map((row) => ({
      row,
      access: evaluateTierAccess(member, normalizeTierAudience(row)),
    }))
    .filter(({ access }) => access.canAccess || access.canPreview)
    .map(({ row, access }) => mapBenefit(row, access));
}
