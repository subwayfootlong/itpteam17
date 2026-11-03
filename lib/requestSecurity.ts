const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function expectedOrigin(requestUrl: string): string | null {
  try {
    return new URL(process.env.APP_URL || requestUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Reject unsafe browser requests unless the browser-provided Origin exactly
 * matches the application's canonical origin. Internal bearer-authenticated
 * routes are excluded by the caller because they do not use session cookies.
 */
export function isSameOriginMutation(request: Request): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const expected = expectedOrigin(request.url);
  const supplied = request.headers.get("origin");
  return Boolean(expected && supplied && supplied === expected);
}

