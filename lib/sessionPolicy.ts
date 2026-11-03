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

