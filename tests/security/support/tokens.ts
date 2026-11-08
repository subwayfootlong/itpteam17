import jwt from "jsonwebtoken";

// Builds session tokens for the session-handling tests (SFR-06, SNFR-01).
// Test-made tokens carry no session ID (`jti`), so they can't be on a member's
// revoked list and each one is valid apart from the single thing a test changes.
// Revocation itself is tested with real tokens issued by /api/auth/login.
// Uses the same JWT_SECRET as the server so "correctly signed but expired" and
// "correctly signed with an extra claim" tokens can be made; forged tokens use
// a different secret or no signature.

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required in .env.local");
  return value;
}

export type SessionUser = { id: string; email: string };

const claims = (u: SessionUser) => ({ sub: u.id, email: u.email });

export function signedSession(user: SessionUser, extra: Record<string, unknown> = {}, expiresIn: number | string = "1h") {
  return jwt.sign({ ...claims(user), ...extra }, secret(), { expiresIn } as jwt.SignOptions);
}

export function expiredSession(user: SessionUser) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ ...claims(user), iat: now - 7200, exp: now - 3600 }, secret());
}

export function wrongSecretSession(user: SessionUser) {
  return jwt.sign(claims(user), "not-the-server-secret-" + "x".repeat(40), { expiresIn: "1h" });
}

export function unsignedSession(user: SessionUser) {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ ...claims(user), iat: now, exp: now + 3600 })}.`;
}

/** Flip one character of the signature, keeping the header and payload intact. */
export function tamperSignature(token: string) {
  const [h, p, s] = token.split(".");
  const flipped = s[0] === "A" ? `B${s.slice(1)}` : `A${s.slice(1)}`;
  return `${h}.${p}.${flipped}`;
}

/** Change one field of the payload without re-signing. */
export function tamperPayload(token: string, change: Record<string, unknown>) {
  const [h, p, s] = token.split(".");
  const payload = JSON.parse(Buffer.from(p, "base64url").toString());
  const next = Buffer.from(JSON.stringify({ ...payload, ...change })).toString("base64url");
  return `${h}.${next}.${s}`;
}

export function decode(token: string) {
  return jwt.decode(token, { complete: true });
}

/**
 * Cookie header for a request made with a given session token. Includes a fresh
 * `last_activity` by default: the portal rejects sessions without one, so leaving it
 * out would make every token check fail for that reason instead of the one tested.
 */
export function sessionCookie(token: string, lastActivity: number = Date.now()) {
  return `token=${token}; last_activity=${lastActivity}`;
}
