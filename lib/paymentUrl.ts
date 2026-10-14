/**
 * Normalises an admin-entered payment link to an absolute http(s) URL.
 * Bare domains ("pay.example.com/x") get https:// prepended.
 * Returns null if the value isn't a usable web link.
 */
export function normalizePaymentUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
