# TC-SFR-06: Secure session and cross-site request handling

Status: **FAIL**  ·  2026-10-29T13:17:51.510Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 token with altered signature | 401 | 401 | PASS |
| 2 | 2 token signed with a different secret | 401 | 401 | PASS |
| 3 | 2 unsigned token (alg: none) | 401 | 401 | PASS |
| 4 | 3 correctly signed but expired token | 401 | 401 | PASS |
| 5 | 4 valid token idle for 16 minutes | 401 | 200 | **FAIL** |
| 6 | 4 idle session cookies cleared | token cookie cleared | not cleared | **FAIL** |
| 7 | 5 logout succeeds | 200 | 200 | PASS |
| 8 | 5 token reused after logout | 401 | 200 | **FAIL** |
| 9 | 6 valid session with Origin: https://evil.example | 403 | 200 | **FAIL** |
| 10 | 7 session cookie sets SameSite explicitly | SameSite=Lax or Strict | no SameSite attribute | **FAIL** |
| 11 | 8a cross-site fetch carried the session | no state change | no state change (opaque) | PASS |
| 12 | 8b cross-site form POST carried the session | no state change | no state change | PASS |
| 13 | 8c control: same form from the portal's own site | state changes (test can detect a successful request) | analytics row created | PASS |
| 14 | 9 valid session (control) | 200 | 200 | PASS |
