# TC-SFR-06: Secure session and cross-site request handling

Status: **PASS**  ·  2026-11-08T14:48:10.411Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 token with altered signature | 401 | 401 | PASS |
| 2 | 2 token signed with a different secret | 401 | 401 | PASS |
| 3 | 2 unsigned token (alg: none) | 401 | 401 | PASS |
| 4 | 3 correctly signed but expired token | 401 | 401 | PASS |
| 5 | 4 valid token idle for 16 minutes | 401 | 401 | PASS |
| 6 | 4 idle session cookies cleared | token cookie cleared | cleared | PASS |
| 7 | 5 the same token works before logout (control) | 200 | 200 | PASS |
| 8 | 5 logout succeeds | 200 | 200 | PASS |
| 9 | 5 token reused after logout | 401 | 401 | PASS |
| 10 | 5 memberA's other session stays signed in | 200 | 200 | PASS |
| 11 | 6 valid session with Origin: https://evil.example | 403 | 403 | PASS |
| 12 | 6 valid session with no Origin header | 403 | 403 | PASS |
| 13 | 7 session cookie sets SameSite explicitly | SameSite=Lax or Strict | SameSite=lax | PASS |
| 14 | 8a cross-site fetch carried the session | no state change | no state change (opaque) | PASS |
| 15 | 8b cross-site form POST carried the session | no state change | no state change | PASS |
| 16 | 8c control: same form from the portal's own site | state changes (test can detect a successful request) | analytics row created | PASS |
| 17 | 9 valid session (control) | 200 | 200 | PASS |
