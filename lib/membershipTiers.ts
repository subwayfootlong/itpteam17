export const MEMBERSHIP_TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'student', label: 'Student' },
  { value: 'associate', label: 'Associate' },
  { value: 'ordinary', label: 'Ordinary' },
] as const;

export type MembershipTier = (typeof MEMBERSHIP_TIERS)[number]['value'];

export const DEFAULT_TIER: MembershipTier = 'basic';

export const TIER_COLORS: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-600',
  ordinary: 'bg-[#e3f6fb] text-[#1a7a8f]',
  associate: 'bg-purple-50 text-purple-700',
  student: 'bg-[#fff4de] text-[#9a6800]',
};

export function formatTierLabel(tier: string | null | undefined): string {
  if (!tier) return 'Basic';
  const match = MEMBERSHIP_TIERS.find((t) => t.value === tier);
  return match?.label ?? tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function isMembershipTier(value: unknown): value is MembershipTier {
  return MEMBERSHIP_TIERS.some((tier) => tier.value === value);
}

export function getAvailableTierUpgrades(
  currentTier: string | null | undefined,
): (typeof MEMBERSHIP_TIERS)[number][] {
  const currentIndex = MEMBERSHIP_TIERS.findIndex((tier) => tier.value === currentTier);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  return MEMBERSHIP_TIERS.slice(safeIndex + 1);
}
