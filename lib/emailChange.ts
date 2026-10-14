import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

export class EmailChangeError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export type EmailChangeUser = { id: string; email: string; password_hash: string };
export type PendingEmailChange = { id: string; new_email: string; otp_hash: string };
export type EmailChangeDependencies = {
  secret: string;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  throttle: (userId: string) => Promise<boolean>;
  start: (user: EmailChangeUser, email: string, id: string, hash: string) => Promise<string>;
  pending: (userId: string) => Promise<PendingEmailChange | null>;
  finish: (userId: string, id: string, matches: boolean) => Promise<string>;
  sendCode: (email: string, otp: string, id: string) => Promise<void>;
  cancel: (userId: string, id: string) => Promise<void>;
  notify: (id: string) => Promise<void>;
};

function checkResult(result: string) {
  const errors: Record<string, [string, number]> = {
    session: ["Please log in again.", 401],
    cooldown: ["Wait 60 seconds before requesting another code.", 429],
    duplicate: ["This email address is already registered.", 409],
    missing: ["Request a new verification code.", 400],
    expired: ["Verification code expired. Request a new code.", 400],
    attempts: ["Too many incorrect attempts. Request a new code.", 429],
    invalid: ["Incorrect verification code.", 400],
  };
  if (result === "ok") return;
  const [message, status] = errors[result] ?? ["Unable to change email. Please try again.", 503];
  throw new EmailChangeError(message, status);
}

export function hashEmailOtp(secret: string, id: string, otp: string) {
  if (secret.length < 32) throw new Error("Email change secret is not configured");
  return createHmac("sha256", secret).update(`${id}:${otp}`).digest("hex");
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

export async function requestEmailChange(
  deps: EmailChangeDependencies, user: EmailChangeUser | null, input: Record<string, unknown>,
) {
  if (!user) throw new EmailChangeError("Please log in first.", 401);
  const email = typeof input.newEmail === "string" ? input.newEmail.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)
    || email.split("@")[0].length > 64 || email.startsWith(".") || email.includes("..") || email.includes(".@")) {
    throw new EmailChangeError("Enter a valid new email address.");
  }
  if (email === user.email.trim().toLowerCase()) throw new EmailChangeError("Enter a different email address.");
  if (!await deps.throttle(user.id)) throw new EmailChangeError("Too many requests. Try again in an hour.", 429);
  if (typeof input.currentPassword !== "string" || !input.currentPassword || input.currentPassword.length > 1024
    || !await deps.verifyPassword(input.currentPassword, user.password_hash)) {
    throw new EmailChangeError("Invalid credentials.", 401);
  }
  const id = randomUUID();
  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
  checkResult(await deps.start(user, email, id, hashEmailOtp(deps.secret, id, otp)));
  try { await deps.sendCode(email, otp, id); }
  catch {
    await deps.cancel(user.id, id);
    throw new EmailChangeError("Unable to send verification code. Please try again later.", 503);
  }
  return { success: true, maskedEmail: maskEmail(email), retryAfter: 60 };
}

export async function verifyEmailChange(
  deps: EmailChangeDependencies, user: EmailChangeUser | null, input: Record<string, unknown>,
) {
  if (!user) throw new EmailChangeError("Please log in first.", 401);
  if (typeof input.otp !== "string" || !/^\d{6}$/.test(input.otp)) throw new EmailChangeError("Enter the six-digit verification code.");
  const pending = await deps.pending(user.id);
  if (!pending) throw new EmailChangeError("Request a new verification code.");
  const actual = Buffer.from(hashEmailOtp(deps.secret, pending.id, input.otp), "hex");
  const expected = Buffer.from(pending.otp_hash, "hex");
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);
  checkResult(await deps.finish(user.id, pending.id, matches));
  // The transaction already queued a durable notification; delivery failure must not undo logout.
  let notificationPending = false;
  try { await deps.notify(pending.id); } catch { notificationPending = true; }
  return { success: true, message: "Email changed successfully. Please log in again.", notificationPending };
}
