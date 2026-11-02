import "server-only";
import { randomUUID } from "node:crypto";
import { createAccessToken, verifyAccessToken } from "./auth";
import { supabaseAdmin } from "./supabaseServer";

type SessionClaims = { sub: string; email: string; sid: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readSessionClaims(token: string): SessionClaims | null {
  try {
    const p = verifyAccessToken(token);
    if (typeof p === "string" || typeof p.sub !== "string" || !uuid.test(p.sub)
      || typeof p.sid !== "string" || !uuid.test(p.sid) || typeof p.email !== "string"
      || typeof p.exp !== "number" || typeof p.iat !== "number"
      || p.iat > Math.floor(Date.now() / 1000) || p.exp - p.iat > 604800) return null;
    return { sub: p.sub, email: p.email, sid: p.sid };
  } catch { return null; }
}

async function sessionRpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (error) throw error; // Callers use the existing sanitized SNFR-03 logger.
  return data;
}

export async function createSession(user: { id: string; email: string }, passwordHash: string) {
  const sid = randomUUID();
  const token = createAccessToken({ sub: user.id, email: user.email, sid });
  const ok = await sessionRpc("auth_session_create", {
    p_user_id: user.id, p_email: user.email, p_password_hash: passwordHash, p_id: sid,
  });
  if (ok !== true) throw new Error("Session creation rejected");
  return token;
}

export async function validateSession(token: string): Promise<SessionClaims | null> {
  const claims = readSessionClaims(token);
  if (!claims) return null;
  const ok = await sessionRpc("auth_session_validate", {
    p_user_id: claims.sub, p_id: claims.sid, p_email: claims.email,
  });
  return ok === true ? claims : null;
}

export async function revokeSession(token: string) {
  // Expired JWTs cannot authenticate; no decoding of unverified claims is needed.
  const claims = readSessionClaims(token);
  if (!claims) return;
  await sessionRpc("auth_session_revoke", { p_user_id: claims.sub, p_id: claims.sid });
}

export async function changeSessionPassword(token: string, oldHash: string, newHash: string) {
  const claims = readSessionClaims(token);
  if (!claims) return false;
  return await sessionRpc("auth_session_change_password", {
    p_user_id: claims.sub, p_id: claims.sid, p_email: claims.email,
    p_old_hash: oldHash, p_new_hash: newHash,
  }) === true;
}
