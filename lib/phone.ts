import {
  parsePhoneNumberFromString,
  isPossiblePhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';

export const DEFAULT_COUNTRY_CODE = '65';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Format for DB storage: "+65 12345678" */
export function formatStoredPhone(value: string): string | null {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed?.isPossible()) return null;
  return `+${parsed.countryCallingCode} ${parsed.nationalNumber}`;
}

/** Lenient check for signup: correct length/structure, not carrier-specific rules. */
export function isAcceptablePhoneNumber(value: string): boolean {
  return isPossiblePhoneNumber(value);
}

export function getPhoneValidationMessage(value: string): string {
  const parsed = parsePhoneNumberFromString(value);
  if (!parsed) {
    return 'Enter your local number using digits only.';
  }

  const country = parsed.country as CountryCode | undefined;
  const hints: Partial<Record<CountryCode, string>> = {
    SG: 'Singapore numbers are 8 digits and usually start with 8 or 9 (e.g. 91234567).',
    MY: 'Malaysia numbers are typically 9–10 digits after the country code.',
    US: 'US numbers are 10 digits after the country code.',
    GB: 'UK numbers are usually 10 digits after the country code.',
  };

  if (country && hints[country]) {
    return hints[country]!;
  }

  return 'Enter a complete phone number for the selected country.';
}
