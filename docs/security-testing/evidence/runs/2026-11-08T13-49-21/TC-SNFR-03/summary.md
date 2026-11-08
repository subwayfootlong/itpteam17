# TC-SNFR-03: Controlled error disclosure

Status: **PASS**  ·  2026-11-08T13:51:36.074Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 malformed JSON to POST /api/community/threads | 4xx; no internal detail | 400; "{"error":"Request body must be a JSON object","details":"Request body " | PASS |
| 2 | 1 wrong types to PATCH /api/member/profile | 4xx; no internal detail | 400; "{"error":"first_name must be a string","details":"first_name must be a" | PASS |
| 3 | 1 invalid UUID to POST /api/events/rsvp | 4xx; no internal detail | 400; "{"error":"eventId is required"}" | PASS |
| 4 | 1 invalid UUID in admin path /api/admin/events/not-a-uuid | 4xx; no internal detail | 400; "{"error":"ID must be a UUID","details":"ID must be a UUID"}" | PASS |
| 5 | 1 invalid UUID in admin path /api/admin/members/not-a-uuid | 4xx; no internal detail | 400; "{"error":"ID must be a UUID","details":"ID must be a UUID"}" | PASS |
| 6 | 1 invalid UUID in admin path /api/admin/announcements/1 or 1=1 | 4xx; no internal detail | 400; "{"error":"ID must be a UUID","details":"ID must be a UUID"}" | PASS |
| 7 | 1 PostgREST filter characters in member search | 4xx; no internal detail | 400; "{"error":"Search contains unsupported filter characters","details":"Se" | PASS |
| 8 | 2 unknown event id | 404 or harmless no-op; no internal detail | 404; "{"error":"Event not found"}" | PASS |
| 9 | 2 unknown announcement id | 404 or harmless no-op; no internal detail | 404; "{"error":"Not found"}" | PASS |
| 10 | 2 unknown member id | 404 or harmless no-op; no internal detail | 404; "{"error":"Member not found"}" | PASS |
| 11 | 2 unknown event for RSVP | 404 or harmless no-op; no internal detail | 404; "{"error":"Event not found"}" | PASS |
| 12 | 2 unknown notification id | 404 or harmless no-op; no internal detail | 200; "{"ok":true}" | PASS |
| 13 | 3 1 MB body to POST /api/community/threads | 4xx; no internal detail | 400; "{"error":"Post cannot exceed 800 characters","details":"Post cannot ex" | PASS |
| 14 | 3 XML body to PATCH /api/member/profile | 4xx; no internal detail | 400; "{"error":"Invalid JSON payload","details":"Invalid JSON payload"}" | PASS |
| 15 | 3 non-image upload to /api/admin/upload | 4xx; no internal detail | 400; "{"error":"Invalid file format. Only JPG, PNG, and WEBP are allowed."}" | PASS |
| 16 | 4 verify QR "garbage" | 4xx; no internal detail | 400; "{"valid":false,"code":"invalid","error":"Invalid Membership QR"}" | PASS |
| 17 | 4 verify QR "a.b.c" | 4xx; no internal detail | 400; "{"valid":false,"code":"invalid","error":"Invalid Membership QR"}" | PASS |
| 18 | 4 verify QR "xxxxxxxxxxxx…" | 4xx; no internal detail | 400; "{"valid":false,"code":"invalid","error":"Invalid Membership QR"}" | PASS |
| 19 | 4 email worker with bad secret | 401; no internal detail | 401; "{"error":"Unauthorized"}" | PASS |
| 20 | 4 notification worker with bad secret | 401; no internal detail | 401; "{"error":"Unauthorized"}" | PASS |
| 21 | 5 unknown page | 404 page; no internal detail | 404; generic 404 page | PASS |
| 22 | 5 unknown API path | 404; no internal detail | 404; "<!DOCTYPE html><html lang="en" class="h-full antialiased" data-scroll-" | PASS |
| 23 | 6 no X-Powered-By or versioned Server header | none | none in 21 responses | PASS |
| 24 | 7 no handler returns a raw error message to the client | 0 files | 0 files | PASS |
| 25 | 7 app/api/admin/analytics/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 26 | 7 app/api/admin/announcements/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 27 | 7 app/api/admin/announcements/[id]/poll-responses/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 28 | 7 app/api/admin/announcements/[id]/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 29 | 7 app/api/admin/batch-onboarding/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 30 | 7 app/api/admin/comment-moderation/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 31 | 7 app/api/admin/discussion-groups/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 32 | 7 app/api/admin/engagement/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 33 | 7 app/api/admin/engagement/[id]/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 34 | 7 app/api/admin/events/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 35 | 7 app/api/admin/events/[id]/registrations/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 36 | 7 app/api/admin/events/[id]/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 37 | 7 app/api/admin/members/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 38 | 7 app/api/admin/members/[id]/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 39 | 7 app/api/admin/payment-methods/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 40 | 7 app/api/admin/payment-methods/[id]/route.ts logs server-side when it returns 5xx | all 4 5xx paths log | all 4 log | PASS |
| 41 | 7 app/api/admin/team/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 42 | 7 app/api/admin/tier-requests/route.ts logs server-side when it returns 5xx | all 4 5xx paths log | all 4 log | PASS |
| 43 | 7 app/api/admin/upload/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 44 | 7 app/api/analytics/track/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 45 | 7 app/api/auth/login/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 46 | 7 app/api/auth/register/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 47 | 7 app/api/community/announcement-comments/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 48 | 7 app/api/community/announcement-poll/route.ts logs server-side when it returns 5xx | all 4 5xx paths log | all 4 log | PASS |
| 49 | 7 app/api/community/thread-comments/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 50 | 7 app/api/community/threads/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 51 | 7 app/api/events/rsvp/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 52 | 7 app/api/internal/email-change-notifications/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 53 | 7 app/api/internal/transactional-emails/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 54 | 7 app/api/member/change-password/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 55 | 7 app/api/member/notification-preferences/route.ts logs server-side when it returns 5xx | all 1 5xx paths log | all 1 log | PASS |
| 56 | 7 app/api/member/notifications/route.ts logs server-side when it returns 5xx | all 3 5xx paths log | all 3 log | PASS |
| 57 | 7 app/api/member/profile/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 58 | 7 app/api/member/qr-token/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 59 | 7 app/api/member/tier-upgrade/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |
| 60 | 7 app/api/verify/member/route.ts logs server-side when it returns 5xx | all 2 5xx paths log | all 2 log | PASS |

## Screenshots

- ![01-unknown-page.png](01-unknown-page.png)
