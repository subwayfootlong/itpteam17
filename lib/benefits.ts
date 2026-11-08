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
import { formatTierLabel } from "./membershipTiers";

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

// Locked rewards tell the member which tier they have, which tier the reward
// needs, and what to do next. A lapsed membership is a renewal problem, not a
// tier problem, so it gets its own wording.
function lockedCopy(access: TierAccessResult) {
  const requiredTiers = access.requiredTierLabels.length
    ? access.requiredTierLabels.join(" or ")
    : "eligible";

  if (access.reason === "inactive_membership") {
    return {
      offer: "For active members only",
      description:
        "Your membership is not active right now. Renew it to use this reward.",
      terms: "Renew your membership to use this reward.",
    };
  }

  return {
    offer: `For ${requiredTiers} members only`,
    description: `Your membership tier is ${formatTierLabel(access.memberTier)}. This reward is for ${requiredTiers} members.`,
    terms: `Upgrade to ${requiredTiers} membership to use this reward.`,
  };
}

function mapBenefit(row: BenefitRow, access: TierAccessResult): Partner {
  const name = row.merchant_name?.trim() || "Pergas Partner";
  const address = row.address?.trim() || "Online or merchant-confirmed redemption";
  const online = isOnlineBenefit(row.address);
  const locked = access.canAccess ? null : lockedCopy(access);

  return {
    id: String(row.id),
    name,
    initials: row.logo_initials?.trim() || initialsFromName(name),
    category: row.category?.trim() || "Other",
    region: online ? "Online" : "Singapore",
    offer: locked ? locked.offer : buildOffer(row),
    description: locked
      ? locked.description
      : row.description?.trim() ||
        `${name} is an admin-listed Friends of Pergas benefit partner.`,
    address: access.canAccess ? address : "Restricted member reward",
    distance: online ? "Online benefit" : "Singapore location",
    terms: locked
      ? locked.terms
      : row.discount_description?.trim() ||
        "Present an active Pergas membership when redeeming. Merchant terms and availability may apply.",
    imageUrl: row.image_url?.trim() || undefined,
    logoUrl: row.logo_url?.trim() || undefined,
    isLocked: !access.canAccess,
    lockReason:
      access.reason === "allowed" ? undefined : access.reason,
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
