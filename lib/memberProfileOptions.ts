export const SALUTATIONS = [
  { value: 'mr', label: 'Mr' },
  { value: 'ms', label: 'Ms' },
  { value: 'ustaz', label: 'Ustaz' },
  { value: 'ustazah', label: 'Ustazah' },
] as const;

export const ARS_STATUSES = [
  { value: 'no', label: 'No' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
] as const;

export const ARS_CERTIFIED_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
] as const;

export type Salutation = (typeof SALUTATIONS)[number]['value'];
export type ArsStatus = (typeof ARS_STATUSES)[number]['value'];

const SALUTATION_VALUES = new Set<string>(SALUTATIONS.map((item) => item.value));
const ARS_STATUS_VALUES = new Set<string>(ARS_STATUSES.map((item) => item.value));

export function isValidSalutation(value: string): value is Salutation {
  return SALUTATION_VALUES.has(value);
}

export function isValidArsStatus(value: string): value is ArsStatus {
  return ARS_STATUS_VALUES.has(value);
}

export function formatSalutationLabel(value: string | null | undefined): string {
  return SALUTATIONS.find((item) => item.value === value)?.label ?? value ?? '';
}

export function formatArsStatusLabel(value: string | null | undefined): string {
  return ARS_STATUSES.find((item) => item.value === value)?.label ?? value ?? '';
}
