# TC-SFR-01: API authorisation and role enforcement

Status: **PASS**  ·  2026-10-29T13:16:53.848Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 anonymous -> admin: GET /api/admin/analytics | 401 | 401 | PASS |
| 2 | 1 anonymous -> admin: GET /api/admin/announcements | 401 | 401 | PASS |
| 3 | 1 anonymous -> admin: POST /api/admin/announcements | 401 | 401 | PASS |
| 4 | 1 anonymous -> admin: GET /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 5 | 1 anonymous -> admin: PATCH /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 6 | 1 anonymous -> admin: DELETE /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 7 | 1 anonymous -> admin: GET /api/admin/announcements/00000000-0000-4000-8000-000000000000/poll-responses | 401 | 401 | PASS |
| 8 | 1 anonymous -> admin: POST /api/admin/batch-onboarding | 401 | 401 | PASS |
| 9 | 1 anonymous -> admin: PATCH /api/admin/comment-moderation | 401 | 401 | PASS |
| 10 | 1 anonymous -> admin: GET /api/admin/dashboard | 401 | 401 | PASS |
| 11 | 1 anonymous -> admin: GET /api/admin/discussion-groups | 401 | 401 | PASS |
| 12 | 1 anonymous -> admin: PATCH /api/admin/discussion-groups | 401 | 401 | PASS |
| 13 | 1 anonymous -> admin: GET /api/admin/engagement | 401 | 401 | PASS |
| 14 | 1 anonymous -> admin: POST /api/admin/engagement | 401 | 401 | PASS |
| 15 | 1 anonymous -> admin: GET /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 16 | 1 anonymous -> admin: PATCH /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 17 | 1 anonymous -> admin: DELETE /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 18 | 1 anonymous -> admin: GET /api/admin/events | 401 | 401 | PASS |
| 19 | 1 anonymous -> admin: POST /api/admin/events | 401 | 401 | PASS |
| 20 | 1 anonymous -> admin: GET /api/admin/events/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 21 | 1 anonymous -> admin: PATCH /api/admin/events/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 22 | 1 anonymous -> admin: DELETE /api/admin/events/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 23 | 1 anonymous -> admin: GET /api/admin/events/00000000-0000-4000-8000-000000000000/registrations | 401 | 401 | PASS |
| 24 | 1 anonymous -> admin: DELETE /api/admin/events/00000000-0000-4000-8000-000000000000/registrations | 401 | 401 | PASS |
| 25 | 1 anonymous -> admin: GET /api/admin/members | 401 | 401 | PASS |
| 26 | 1 anonymous -> admin: GET /api/admin/members/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 27 | 1 anonymous -> admin: PATCH /api/admin/members/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 28 | 1 anonymous -> admin: GET /api/admin/payment-methods | 401 | 401 | PASS |
| 29 | 1 anonymous -> admin: POST /api/admin/payment-methods | 401 | 401 | PASS |
| 30 | 1 anonymous -> admin: GET /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 31 | 1 anonymous -> admin: PATCH /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 32 | 1 anonymous -> admin: DELETE /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 33 | 1 anonymous -> admin: GET /api/admin/team | 401 | 401 | PASS |
| 34 | 1 anonymous -> admin: GET /api/admin/tier-requests | 401 | 401 | PASS |
| 35 | 1 anonymous -> admin: PATCH /api/admin/tier-requests | 401 | 401 | PASS |
| 36 | 1 anonymous -> admin: POST /api/admin/upload | 401 | 401 | PASS |
| 37 | 2 anonymous -> member: POST /api/analytics/track | 401 | 401 | PASS |
| 38 | 2 anonymous -> member: POST /api/community/announcement-comments | 401 | 401 | PASS |
| 39 | 2 anonymous -> member: POST /api/community/announcement-poll | 401 | 401 | PASS |
| 40 | 2 anonymous -> member: POST /api/community/thread-comments | 401 | 401 | PASS |
| 41 | 2 anonymous -> member: POST /api/community/threads | 401 | 401 | PASS |
| 42 | 2 anonymous -> member: GET /api/events/rsvp?eventId=00000000-0000-4000-8000-000000000000 | 401 | 401 | PASS |
| 43 | 2 anonymous -> member: POST /api/events/rsvp | 401 | 401 | PASS |
| 44 | 2 anonymous -> member: DELETE /api/events/rsvp | 401 | 401 | PASS |
| 45 | 2 anonymous -> member: PATCH /api/member/change-password | 401 | 401 | PASS |
| 46 | 2 anonymous -> member: POST /api/member/email-change/request | 401 | 401 | PASS |
| 47 | 2 anonymous -> member: POST /api/member/email-change/verify | 401 | 401 | PASS |
| 48 | 2 anonymous -> member: GET /api/member/notification-preferences | 401 | 401 | PASS |
| 49 | 2 anonymous -> member: PATCH /api/member/notification-preferences | 401 | 401 | PASS |
| 50 | 2 anonymous -> member: GET /api/member/notifications | 401 | 401 | PASS |
| 51 | 2 anonymous -> member: PATCH /api/member/notifications | 401 | 401 | PASS |
| 52 | 2 anonymous -> member: DELETE /api/member/notifications | 401 | 401 | PASS |
| 53 | 2 anonymous -> member: PATCH /api/member/profile | 401 | 401 | PASS |
| 54 | 2 anonymous -> member: GET /api/member/qr-token | 401 | 401 | PASS |
| 55 | 2 anonymous -> member: GET /api/member/tier-upgrade | 401 | 401 | PASS |
| 56 | 2 anonymous -> member: POST /api/member/tier-upgrade | 401 | 401 | PASS |
| 57 | 2 anonymous -> member: POST /api/auth/activity | 401 | 401 | PASS |
| 58 | 3 member -> admin: GET /api/admin/analytics | 403 | 403 | PASS |
| 59 | 3 member -> admin: GET /api/admin/announcements | 403 | 403 | PASS |
| 60 | 3 member -> admin: POST /api/admin/announcements | 403 | 403 | PASS |
| 61 | 3 member -> admin: GET /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 62 | 3 member -> admin: PATCH /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 63 | 3 member -> admin: DELETE /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 64 | 3 member -> admin: GET /api/admin/announcements/00000000-0000-4000-8000-000000000000/poll-responses | 403 | 403 | PASS |
| 65 | 3 member -> admin: POST /api/admin/batch-onboarding | 403 | 403 | PASS |
| 66 | 3 member -> admin: PATCH /api/admin/comment-moderation | 403 | 403 | PASS |
| 67 | 3 member -> admin: GET /api/admin/dashboard | 403 | 403 | PASS |
| 68 | 3 member -> admin: GET /api/admin/discussion-groups | 403 | 403 | PASS |
| 69 | 3 member -> admin: PATCH /api/admin/discussion-groups | 403 | 403 | PASS |
| 70 | 3 member -> admin: GET /api/admin/engagement | 403 | 403 | PASS |
| 71 | 3 member -> admin: POST /api/admin/engagement | 403 | 403 | PASS |
| 72 | 3 member -> admin: GET /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 73 | 3 member -> admin: PATCH /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 74 | 3 member -> admin: DELETE /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 75 | 3 member -> admin: GET /api/admin/events | 403 | 403 | PASS |
| 76 | 3 member -> admin: POST /api/admin/events | 403 | 403 | PASS |
| 77 | 3 member -> admin: GET /api/admin/events/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 78 | 3 member -> admin: PATCH /api/admin/events/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 79 | 3 member -> admin: DELETE /api/admin/events/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 80 | 3 member -> admin: GET /api/admin/events/00000000-0000-4000-8000-000000000000/registrations | 403 | 403 | PASS |
| 81 | 3 member -> admin: DELETE /api/admin/events/00000000-0000-4000-8000-000000000000/registrations | 403 | 403 | PASS |
| 82 | 3 member -> admin: GET /api/admin/members | 403 | 403 | PASS |
| 83 | 3 member -> admin: GET /api/admin/members/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 84 | 3 member -> admin: PATCH /api/admin/members/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 85 | 3 member -> admin: GET /api/admin/payment-methods | 403 | 403 | PASS |
| 86 | 3 member -> admin: POST /api/admin/payment-methods | 403 | 403 | PASS |
| 87 | 3 member -> admin: GET /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 88 | 3 member -> admin: PATCH /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 89 | 3 member -> admin: DELETE /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 90 | 3 member -> admin: GET /api/admin/team | 403 | 403 | PASS |
| 91 | 3 member -> admin: GET /api/admin/tier-requests | 403 | 403 | PASS |
| 92 | 3 member -> admin: PATCH /api/admin/tier-requests | 403 | 403 | PASS |
| 93 | 3 member -> admin: POST /api/admin/upload | 403 | 403 | PASS |
| 94 | 4 admin -> member: POST /api/analytics/track | 403 | 403 | PASS |
| 95 | 4 admin -> member: POST /api/community/announcement-comments | 403 | 403 | PASS |
| 96 | 4 admin -> member: POST /api/community/announcement-poll | 403 | 403 | PASS |
| 97 | 4 admin -> member: POST /api/community/thread-comments | 403 | 403 | PASS |
| 98 | 4 admin -> member: POST /api/community/threads | 403 | 403 | PASS |
| 99 | 4 admin -> member: GET /api/events/rsvp?eventId=00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 100 | 4 admin -> member: POST /api/events/rsvp | 403 | 403 | PASS |
| 101 | 4 admin -> member: DELETE /api/events/rsvp | 403 | 403 | PASS |
| 102 | 4 admin -> member: PATCH /api/member/change-password | 403 | 403 | PASS |
| 103 | 4 admin -> member: POST /api/member/email-change/request | 403 | 403 | PASS |
| 104 | 4 admin -> member: POST /api/member/email-change/verify | 403 | 403 | PASS |
| 105 | 4 admin -> member: GET /api/member/notification-preferences | 403 | 403 | PASS |
| 106 | 4 admin -> member: PATCH /api/member/notification-preferences | 403 | 403 | PASS |
| 107 | 4 admin -> member: GET /api/member/notifications | 403 | 403 | PASS |
| 108 | 4 admin -> member: PATCH /api/member/notifications | 403 | 403 | PASS |
| 109 | 4 admin -> member: DELETE /api/member/notifications | 403 | 403 | PASS |
| 110 | 4 admin -> member: PATCH /api/member/profile | 403 | 403 | PASS |
| 111 | 4 admin -> member: GET /api/member/qr-token | 403 | 403 | PASS |
| 112 | 4 admin -> member: GET /api/member/tier-upgrade | 403 | 403 | PASS |
| 113 | 4 admin -> member: POST /api/member/tier-upgrade | 403 | 403 | PASS |
| 114 | 5 internal, no secret: POST /api/internal/email-change-notifications | 401 | 401 | PASS |
| 115 | 5 internal, no secret: POST /api/internal/transactional-emails | 401 | 401 | PASS |
| 116 | 5 internal, wrong secret: POST /api/internal/email-change-notifications | 401 | 401 | PASS |
| 117 | 5 internal, wrong secret: POST /api/internal/transactional-emails | 401 | 401 | PASS |
| 118 | 6 member token claiming admin -> admin: GET /api/admin/analytics | 403 | 403 | PASS |
| 119 | 6 member token claiming admin -> admin: GET /api/admin/announcements | 403 | 403 | PASS |
| 120 | 6 member token claiming admin -> admin: POST /api/admin/announcements | 403 | 403 | PASS |
| 121 | 6 member token claiming admin -> admin: GET /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 122 | 6 member token claiming admin -> admin: PATCH /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 123 | 6 member token claiming admin -> admin: DELETE /api/admin/announcements/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 124 | 6 member token claiming admin -> admin: GET /api/admin/announcements/00000000-0000-4000-8000-000000000000/poll-responses | 403 | 403 | PASS |
| 125 | 6 member token claiming admin -> admin: POST /api/admin/batch-onboarding | 403 | 403 | PASS |
| 126 | 6 member token claiming admin -> admin: PATCH /api/admin/comment-moderation | 403 | 403 | PASS |
| 127 | 6 member token claiming admin -> admin: GET /api/admin/dashboard | 403 | 403 | PASS |
| 128 | 6 member token claiming admin -> admin: GET /api/admin/discussion-groups | 403 | 403 | PASS |
| 129 | 6 member token claiming admin -> admin: PATCH /api/admin/discussion-groups | 403 | 403 | PASS |
| 130 | 6 member token claiming admin -> admin: GET /api/admin/engagement | 403 | 403 | PASS |
| 131 | 6 member token claiming admin -> admin: POST /api/admin/engagement | 403 | 403 | PASS |
| 132 | 6 member token claiming admin -> admin: GET /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 133 | 6 member token claiming admin -> admin: PATCH /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 134 | 6 member token claiming admin -> admin: DELETE /api/admin/engagement/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 135 | 6 member token claiming admin -> admin: GET /api/admin/events | 403 | 403 | PASS |
| 136 | 6 member token claiming admin -> admin: POST /api/admin/events | 403 | 403 | PASS |
| 137 | 6 member token claiming admin -> admin: GET /api/admin/events/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 138 | 6 member token claiming admin -> admin: PATCH /api/admin/events/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 139 | 6 member token claiming admin -> admin: DELETE /api/admin/events/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 140 | 6 member token claiming admin -> admin: GET /api/admin/events/00000000-0000-4000-8000-000000000000/registrations | 403 | 403 | PASS |
| 141 | 6 member token claiming admin -> admin: DELETE /api/admin/events/00000000-0000-4000-8000-000000000000/registrations | 403 | 403 | PASS |
| 142 | 6 member token claiming admin -> admin: GET /api/admin/members | 403 | 403 | PASS |
| 143 | 6 member token claiming admin -> admin: GET /api/admin/members/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 144 | 6 member token claiming admin -> admin: PATCH /api/admin/members/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 145 | 6 member token claiming admin -> admin: GET /api/admin/payment-methods | 403 | 403 | PASS |
| 146 | 6 member token claiming admin -> admin: POST /api/admin/payment-methods | 403 | 403 | PASS |
| 147 | 6 member token claiming admin -> admin: GET /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 148 | 6 member token claiming admin -> admin: PATCH /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 149 | 6 member token claiming admin -> admin: DELETE /api/admin/payment-methods/00000000-0000-4000-8000-000000000000 | 403 | 403 | PASS |
| 150 | 6 member token claiming admin -> admin: GET /api/admin/team | 403 | 403 | PASS |
| 151 | 6 member token claiming admin -> admin: GET /api/admin/tier-requests | 403 | 403 | PASS |
| 152 | 6 member token claiming admin -> admin: PATCH /api/admin/tier-requests | 403 | 403 | PASS |
| 153 | 6 member token claiming admin -> admin: POST /api/admin/upload | 403 | 403 | PASS |
