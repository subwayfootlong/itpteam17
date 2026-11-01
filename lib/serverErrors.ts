import "server-only";
import { unstable_rethrow } from "next/navigation";

// Explicit allowlists: arbitrary names/codes can themselves contain credentials.
const safeCodes = new Set([
  "23505", "23503", "23502", "23514", "42501", "42P01", "42703",
  "40001", "40P01", "57014", "53300", "08001", "08006",
  "PGRST116", "PGRST202", "PGRST204", "PGRST301", "PGRST302",
  "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN",
]);

function safeCode(error: unknown): string {
  try {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    return typeof code === "string" && safeCodes.has(code) ? code : "unknown";
  } catch {
    return "unknown";
  }
}

/** operation must be a static label, never a URL, request field or user value. */
export function logServerError(operation: string, error: unknown): string {
  const referenceId = crypto.randomUUID();
  const type = error instanceof TypeError ? "TypeError"
    : error instanceof RangeError ? "RangeError"
    : error instanceof SyntaxError ? "SyntaxError"
    : error instanceof Error ? "Error" : "UnknownError";
  // Deliberately omit message, stack, cause, SQL, request data and arbitrary fields.
  console.error("Server operation failed", { operation, referenceId, type, code: safeCode(error) });
  return referenceId;
}

export function unexpectedApiError(operation: string, error: unknown): Response {
  unstable_rethrow(error);
  const referenceId = logServerError(operation, error);
  return Response.json({ error: "Unable to complete request" }, {
    status: 500,
    headers: { "Cache-Control": "no-store", "X-Error-Reference": referenceId },
  });
}
