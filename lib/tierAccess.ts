import {
  DEFAULT_TIER,
  MEMBERSHIP_TIERS,
  formatTierLabel,
  type MembershipTier,
} from "./membershipTiers";

export type AudienceType = "all" | "selected_tiers";

export type TierAudience = {
  audienceType: AudienceType;
  eligibleTiers: MembershipTier[];
  showLockedPreview: boolean;
};

export type TierAudienceRow = {
  audience_type?: string | null;
  eligible_tiers?: unknown;
  show_locked_preview?: boolean | null;
};

export type MemberAccessContext = {
  membershipTier?: string | null;
  membershipStatus?: string | null;
  expiryDate?: string | null;
};

export type TierAccessResult = {
  canAccess: boolean;
  canPreview: boolean;
  memberTier: MembershipTier;
  requiredTierLabels: string[];
  reason: "allowed" | "inactive_membership" | "tier_not_eligible";
};

const VALID_TIERS = new Set<string>(
  MEMBERSHIP_TIERS.map((tier) => tier.value),
);

export const DEFAULT_TIER_AUDIENCE: TierAudience = {
  audienceType: "all",
  eligibleTiers: [],
  showLockedPreview: false,
};

export function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === "string" && VALID_TIERS.has(value);
}

export function normalizeMembershipTier(value: unknown): MembershipTier {
  return isMembershipTier(value) ? value : DEFAULT_TIER;
}

export function normalizeEligibleTiers(value: unknown): MembershipTier[] {
  if (!Array.isArray(value)) return [];

  return [...new Set(value.filter(isMembershipTier))];
}

export function normalizeTierAudience(row?: TierAudienceRow | null): TierAudience {
  const audienceType: AudienceType =
    row?.audience_type === "selected_tiers" ? "selected_tiers" : "all";

  return {
    audienceType,
    eligibleTiers:
      audienceType === "selected_tiers"
        ? normalizeEligibleTiers(row?.eligible_tiers)
        : [],
    showLockedPreview: Boolean(row?.show_locked_preview),
  };
}

export function validateTierAudience(input: {
  audience_type?: unknown;
  eligible_tiers?: unknown;
  show_locked_preview?: unknown;
}): { ok: true; value: TierAudience } | { ok: false; error: string } {
  const audienceType = input.audience_type ?? "all";

  if (audienceType !== "all" && audienceType !== "selected_tiers") {
    return { ok: false, error: "Audience must be all or selected tiers." };
  }

  if (
    input.eligible_tiers !== undefined &&
    !Array.isArray(input.eligible_tiers)
  ) {
    return { ok: false, error: "Eligible tiers must be an array." };
  }

  const rawTiers = Array.isArray(input.eligible_tiers)
    ? input.eligible_tiers
    : [];
  const eligibleTiers = normalizeEligibleTiers(rawTiers);

  if (eligibleTiers.length !== rawTiers.length) {
    return { ok: false, error: "One or more membership tiers are invalid." };
  }

  if (audienceType === "selected_tiers" && eligibleTiers.length === 0) {
    return { ok: false, error: "Select at least one eligible membership tier." };
  }

  if (
    input.show_locked_preview !== undefined &&
    typeof input.show_locked_preview !== "boolean"
  ) {
    return { ok: false, error: "Locked preview must be true or false." };
  }

  return {
    ok: true,
    value: {
      audienceType,
      eligibleTiers: audienceType === "all" ? [] : eligibleTiers,
      showLockedPreview: Boolean(input.show_locked_preview),
    },
  };
}

export function tierAudienceToDatabase(audience: TierAudience) {
  return {
    audience_type: audience.audienceType,
    eligible_tiers:
      audience.audienceType === "all" ? [] : audience.eligibleTiers,
    show_locked_preview: audience.showLockedPreview,
  };
}

export function isActiveMembership(member: MemberAccessContext): boolean {
  if (member.membershipStatus?.toLowerCase() !== "active") return false;
  if (!member.expiryDate) return true;

  const expiryDate = new Date(`${member.expiryDate.slice(0, 10)}T23:59:59`);
  return !Number.isNaN(expiryDate.getTime()) && expiryDate >= new Date();
}

export function evaluateTierAccess(
  member: MemberAccessContext,
  audience: TierAudience,
): TierAccessResult {
  const memberTier = normalizeMembershipTier(member.membershipTier);
  const requiredTierLabels = audience.eligibleTiers.map(formatTierLabel);

  if (!isActiveMembership(member)) {
    return {
      canAccess: false,
      canPreview: audience.showLockedPreview,
      memberTier,
      requiredTierLabels,
      reason: "inactive_membership",
    };
  }

  const canAccess =
    audience.audienceType === "all" ||
    audience.eligibleTiers.includes(memberTier);

  return {
    canAccess,
    canPreview: !canAccess && audience.showLockedPreview,
    memberTier,
    requiredTierLabels,
    reason: canAccess ? "allowed" : "tier_not_eligible",
  };
}

export function formatAudienceLabel(audience: TierAudience): string {
  if (audience.audienceType === "all") return "All members";
  return audience.eligibleTiers.map(formatTierLabel).join(", ");
}
