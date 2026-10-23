export class InputValidationError extends Error {}

export function invalidInput(details: string) {
  return Response.json({ error: details, details }, { status: 400 });
}

export async function readJsonObject(request: Request, validate?: (body: Record<string, unknown>) => void): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new InputValidationError("Invalid JSON payload");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InputValidationError("Request body must be a JSON object");
  }
  const object = body as Record<string, unknown>;
  validate?.(object);
  return object;
}

export function inputError(validate: () => void): Response | null {
  try { validate(); return null; } catch (error) {
    if (error instanceof InputValidationError) return invalidInput(error.message);
    throw error;
  }
}

export function requireEnum(value: unknown, label: string, values: readonly string[]) {
  if (!isOneOf(value, values)) throw new InputValidationError(`${label} must be one of: ${values.join(", ")}`);
}

export function requireInteger(value: unknown, label: string, min = 0, max = 2147483647) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new InputValidationError(`${label} must be an integer between ${min} and ${max}`);
  }
}

export function requireDate(value: unknown, label: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new InputValidationError(`${label} must be a valid date (YYYY-MM-DD)`);
  }
}

export function requireEmail(value: unknown) {
  const email = requireString(value, "Email", 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.split("@")[0].length > 64) {
    throw new InputValidationError("Enter a valid email address");
  }
}

export function requireWebUrl(value: unknown, label: string) {
  const text = requireString(value, label, 2048);
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch { throw new InputValidationError(`${label} must be an HTTP or HTTPS URL`); }
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function requireUuid(value: unknown, label: string): asserts value is string {
  if (!isUuid(value)) throw new InputValidationError(`${label} must be a UUID`);
}

export function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

export function requireString(value: unknown, label: string, max: number, min = 1): string {
  if (typeof value !== "string") throw new InputValidationError(`${label} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new InputValidationError(`${label} must contain at least ${min} characters`);
  if (value.length > max) throw new InputValidationError(`${label} cannot exceed ${max} characters`);
  if (value.includes("\u0000")) throw new InputValidationError(`${label} contains an invalid character`);
  return trimmed;
}

// Content stays plain text end-to-end. React escapes it at every display site;
// this rejects markup, never strips or tries to sanitise HTML into safe HTML.
export function requirePlainText(value: unknown, label: string, max: number, min = 1): string {
  const text = requireString(value, label, max, min);
  if (/<\/?[a-z][^>]*>|<!--|<!doctype/i.test(text)) {
    throw new InputValidationError(`${label} must be plain text without HTML markup`);
  }
  return text;
}
