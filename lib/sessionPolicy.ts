export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const LAST_ACTIVITY_COOKIE = "last_activity";
export const LOGOUT_LOGIN_HINT_KEY = "pergas:show-login-after-logout";
export const SESSION_COOKIE = "token";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    priority: "high" as const,
  };
}

export function getLastActivityTimestamp(
  cookieValue: string | undefined,
): number | null {
  if (!cookieValue) return null;

  const parsed = Number(cookieValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isSessionIdleExpired(lastActivity: number): boolean {
  return Date.now() - lastActivity > SESSION_IDLE_TIMEOUT_MS;
}

/*
 * Server-side logout (SFR-06 / DEF-03). Every session token has its own ID (`jti`).
 * Logging out records "<jti>:<exp>" in `users.revoked_sessions`, so that one token
 * is rejected from then on while the member's other devices stay signed in.
 * Entries are dropped once the token would have expired anyway, which keeps the
 * list short (docs/supabase-session-revocation.sql). Tokens issued before session
 * IDs existed have no `jti` and can't be revoked; they expire within 7 days.
 */
export function sessionId(payload: object): string | null {
  const jti = (payload as { jti?: unknown }).jti;
  return typeof jti === "string" && /^[0-9a-f-]{36}$/i.test(jti) ? jti : null;
}

export function isSessionRevoked(payload: object, revokedSessions: unknown): boolean {
  const id = sessionId(payload);
  if (!id || !Array.isArray(revokedSessions)) return false;
  return revokedSessions.some((entry) => typeof entry === "string" && entry.startsWith(`${id}:`));
}

/** The revoked list after revoking this token: its entry added, expired entries removed. */
export function withSessionRevoked(revokedSessions: unknown, id: string, exp: number, nowSeconds = Math.floor(Date.now() / 1000)): string[] {
  const live = (Array.isArray(revokedSessions) ? revokedSessions : []).filter((entry): entry is string => {
    if (typeof entry !== "string") return false;
    const entryExp = Number(entry.split(":")[1]);
    return Number.isFinite(entryExp) && entryExp > nowSeconds && !entry.startsWith(`${id}:`);
  });
  return [...live, `${id}:${exp}`];
}

