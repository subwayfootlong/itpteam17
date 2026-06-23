export const MEMBERSHIP_TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'ordinary', label: 'Ordinary' },
  { value: 'associate', label: 'Associate' },
  { value: 'student', label: 'Student' },
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
