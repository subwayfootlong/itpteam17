// SNFR-03: record server-side failures so they can be diagnosed, while clients only
// ever see a generic message. Logs which operation failed and the database or error
// code, never request bodies, query values or raw database messages (those can
// contain personal data, e.g. the email in a duplicate-key error).
export function logServerError(operation: string, error?: unknown) {
  console.error(`[api] ${operation} failed`, { code: errorCode(error) });
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "unknown";
  const { code, name } = error as { code?: unknown; name?: unknown };
  // Postgres SQLSTATE (e.g. 23505) or PostgREST code (e.g. PGRST116).
  if (typeof code === "string" && /^[A-Z0-9]{5,10}$/.test(code)) return code;
  // Thrown JavaScript errors: the class name only (e.g. TypeError), not the message.
  if (typeof name === "string" && /^[A-Za-z]{2,40}$/.test(name)) return name;
  return "unknown";
}
