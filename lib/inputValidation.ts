export class InputValidationError extends Error {}

export function invalidInput(details: string) {
  return Response.json({ error: details, details }, { status: 400 });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new InputValidationError("Invalid JSON payload");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InputValidationError("Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
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
