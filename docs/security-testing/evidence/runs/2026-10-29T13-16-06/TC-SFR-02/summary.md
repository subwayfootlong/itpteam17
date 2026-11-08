# TC-SFR-02: Resource-level access control

Status: **PASS**  ·  2026-10-29T13:16:59.389Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 memberA's own profile updated | designation = "[security-test] A" | 200, designation = "[security-test] A" | PASS |
| 2 | 1 memberB's profile unchanged | identical to before | identical | PASS |
| 3 | 2 memberB's notification still unread | is_read = false | 200, is_read = false | PASS |
| 4 | 3 GET notifications counts only memberA's | unreadCount = 22 (memberA's own) | unreadCount = 22 | PASS |
| 5 | 4 memberB's registration still exists | status = registered | 400, status = registered | PASS |
| 6 | 5 memberB's pending thread hidden from memberA | not-found screen; thread content not in page source | not-found screen; content not in page source | PASS |
| 7 | 6 tier-upgrade GET excludes memberB's request | memberB's request not listed | 200, 0 request(s), memberB's not listed | PASS |
| 8 | 7 QR token identifies memberA even when memberB's id is passed | memberId = memberA (f7081c04-31f7-4eb8-9d88-425f0d89dfb5) | memberId = memberA | PASS |

## Screenshots

- ![01-membera-opens-memberb-pending-thread.png](01-membera-opens-memberb-pending-thread.png)
