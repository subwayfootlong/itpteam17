import jwt from "jsonwebtoken";

// Builds session tokens for the session-handling tests (SFR-06, SNFR-01).
// Uses the same JWT_SECRET as the server so "correctly signed but expired" and
// "correctly signed with an extra claim" tokens can be made; forged tokens use
// a different secret or no signature.

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required in .env.local");
  return value;
}

export function signedSession(userId: string, email: string, extra: Record<string, unknown> = {}, expiresIn: number | string = "1h") {
  return jwt.sign({ sub: userId, email, ...extra }, secret(), { expiresIn } as jwt.SignOptions);
}

export function expiredSession(userId: string, email: string) {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ sub: userId, email, iat: now - 7200, exp: now - 3600 }, secret());
}

export function wrongSecretSession(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, "not-the-server-secret-" + "x".repeat(40), { expiresIn: "1h" });
}

export function unsignedSession(userId: string, email: string) {
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ sub: userId, email, iat: now, exp: now + 3600 })}.`;
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

/** Cookie header for a request made with a given session token. */
export function sessionCookie(token: string, lastActivity?: number) {
  return lastActivity === undefined ? `token=${token}` : `token=${token}; last_activity=${lastActivity}`;
}
