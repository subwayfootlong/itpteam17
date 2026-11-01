/** Exact, case-insensitive email lookup via PostgREST's regexIMatch operator. */
export function emailMatchPattern(email: string): string {
  // Escape regex syntax so punctuation in an address is always literal.
  // Surrounding spaces match the existing lower(btrim(email)) unique index.
  const literal = email.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^ *${literal} *$`;
}
