import type { ThreadStatus } from "./communityTypes";

export const flaggedWords = ["spam", "scam", "hate", "offensive"];

export function moderationStatus(body: string): ThreadStatus {
  const normalized = body.toLowerCase();
  return flaggedWords.some((word) => normalized.includes(word))
    ? "flagged"
    : "pending";
}
