// The API route inventory from test-cases.md Appendix A.
// `[id]` segments are filled with a random UUID that matches no record, and the
// body is `{}`, so if an authorisation check were missing the request still
// could not change real data.

export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
export type RouteCase = { method: Method; path: string; note?: string };

const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

function expand(path: string, methods: Method[], note?: string): RouteCase[] {
  const filled = path.replace(/\[id\]/g, NO_SUCH_ID);
  return methods.map((method) => ({ method, path: filled, note }));
}

export const ADMIN_ROUTES: RouteCase[] = [
  ...expand("/api/admin/analytics", ["GET"]),
  ...expand("/api/admin/announcements", ["GET", "POST"]),
  ...expand("/api/admin/announcements/[id]", ["GET", "PATCH", "DELETE"]),
  ...expand("/api/admin/announcements/[id]/poll-responses", ["GET"]),
  ...expand("/api/admin/batch-onboarding", ["POST"]),
  ...expand("/api/admin/comment-moderation", ["PATCH"]),
  ...expand("/api/admin/dashboard", ["GET"]),
  ...expand("/api/admin/discussion-groups", ["GET", "PATCH"]),
  ...expand("/api/admin/engagement", ["GET", "POST"]),
  ...expand("/api/admin/engagement/[id]", ["GET", "PATCH", "DELETE"]),
  ...expand("/api/admin/events", ["GET", "POST"]),
  ...expand("/api/admin/events/[id]", ["GET", "PATCH", "DELETE"]),
  ...expand("/api/admin/events/[id]/registrations", ["GET", "DELETE"]),
  ...expand("/api/admin/members", ["GET"]),
  ...expand("/api/admin/members/[id]", ["GET", "PATCH"]),
  ...expand("/api/admin/payment-methods", ["GET", "POST"]),
  ...expand("/api/admin/payment-methods/[id]", ["GET", "PATCH", "DELETE"]),
  ...expand("/api/admin/team", ["GET"]),
  ...expand("/api/admin/tier-requests", ["GET", "PATCH"]),
  ...expand("/api/admin/upload", ["POST"]),
];

export const MEMBER_ROUTES: RouteCase[] = [
  ...expand("/api/analytics/track", ["POST"]),
  ...expand("/api/community/announcement-comments", ["POST"]),
  ...expand("/api/community/announcement-poll", ["POST"]),
  ...expand("/api/community/thread-comments", ["POST"]),
  ...expand("/api/community/threads", ["POST"]),
  ...expand(`/api/events/rsvp?eventId=${NO_SUCH_ID}`, ["GET"]),
  ...expand("/api/events/rsvp", ["POST", "DELETE"]),
  ...expand("/api/member/change-password", ["PATCH"]),
  ...expand("/api/member/email-change/request", ["POST"], "also requires same-origin Origin"),
  ...expand("/api/member/email-change/verify", ["POST"], "also requires same-origin Origin"),
  ...expand("/api/member/notification-preferences", ["GET", "PATCH"]),
  ...expand("/api/member/notifications", ["GET", "PATCH", "DELETE"]),
  ...expand("/api/member/profile", ["PATCH"]),
  ...expand("/api/member/qr-token", ["GET"], "checks the session directly"),
  ...expand("/api/member/tier-upgrade", ["GET", "POST"]),
];

/** Any signed-in user, member or admin, by design. */
export const ANY_USER_ROUTES: RouteCase[] = [...expand("/api/auth/activity", ["POST"])];

export const INTERNAL_ROUTES: RouteCase[] = [
  ...expand("/api/internal/email-change-notifications", ["POST"]),
  ...expand("/api/internal/transactional-emails", ["POST"]),
];

/** Handlers that read a JSON body, for the input validation tests (SFR-04). */
export const BODY_ROUTES = [...ADMIN_ROUTES, ...MEMBER_ROUTES].filter(
  (r) => r.method !== "GET" && r.method !== "DELETE",
);

export { NO_SUCH_ID };
