import jwt from "jsonwebtoken";

export const MEMBERSHIP_QR_TTL = 300;
const PURPOSE = "membership-verification";

function secret() {
  const value = process.env.MEMBERSHIP_QR_SECRET;
  if (!value || Buffer.byteLength(value) < 32) {
    throw new Error("Membership QR configuration unavailable");
  }
  return value;
}

export function generateMembershipQrToken(memberId: string) {
  return jwt.sign({ memberId, purpose: PURPOSE }, secret(), {
    algorithm: "HS256",
    expiresIn: MEMBERSHIP_QR_TTL,
  });
}

export function verifyMembershipQrToken(token: string):
  | { valid: true; memberId: string }
  | { valid: false; code: "expired" | "invalid" } {
  const key = secret();
  if (token.length > 2048) return { valid: false, code: "invalid" };
  try {
    const payload = jwt.verify(token, key, { algorithms: ["HS256"] });
    if (
      typeof payload === "string" ||
      payload.purpose !== PURPOSE ||
      typeof payload.memberId !== "string" || !payload.memberId.trim() ||
      typeof payload.iat !== "number" || typeof payload.exp !== "number" ||
      payload.exp - payload.iat !== MEMBERSHIP_QR_TTL ||
      payload.iat > Math.floor(Date.now() / 1000)
    ) return { valid: false, code: "invalid" };
    return { valid: true, memberId: payload.memberId };
  } catch (error) {
    return { valid: false, code: error instanceof jwt.TokenExpiredError ? "expired" : "invalid" };
  }
}

export function membershipVerificationUrl(token: string, requestUrl: string) {
  // Use a configured canonical URL in production; same-origin works for local development.
  const base = process.env.APP_URL || new URL(requestUrl).origin;
  const url = new URL("/verify/member", base);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid application URL");
  url.searchParams.set("token", token);
  return url.toString();
}

export const qrResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
