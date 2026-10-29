# TC-SFR-08: Secure email address change

Status: **PASS**  ·  2026-10-29T13:18:02.177Z

| # | Step | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | 1 no current password | 401 | 401 "Invalid credentials." | PASS |
| 2 | 1 wrong current password | 401 | 401 "Invalid credentials." | PASS |
| 3 | 1 no request created after failed re-authentication | 0 pending requests | 0 pending request(s) | PASS |
| 4 | 2 invalid email format | 400 | 400 "Enter a valid new email address." | PASS |
| 5 | 3 email already used by another account | 409 | 409 "This email address is already registered." | PASS |
| 6 | 5 no Origin header | 403 | 403 "Invalid request origin or content type." | PASS |
| 7 | 5 foreign Origin | 403 | 403 "Invalid request origin or content type." | PASS |
| 8 | 6 admin account | 403 | 403 "Forbidden" | PASS |
| 9 | 7 wrong code | 400 | 400 "Incorrect verification code." | PASS |
| 10 | 7 email not changed | member5@uat.pergas.org | member5@uat.pergas.org | PASS |
| 11 | 8 correct code after 5 wrong attempts | 429 | 429 "Too many incorrect attempts. Request a new code." | PASS |
| 12 | 8 email not changed | member5@uat.pergas.org | member5@uat.pergas.org | PASS |
| 13 | 9 correct code after expiry | 400 | 400 "Verification code expired. Request a new code." | PASS |
| 14 | 9 email not changed | member5@uat.pergas.org | member5@uat.pergas.org | PASS |
| 15 | 10 correct code within the time limit | 200 | 200 "Email changed successfully. Please log in again." | PASS |
| 16 | 10 email changed | member5+security-test@uat.pergas.org | member5+security-test@uat.pergas.org | PASS |
| 17 | 10 session ended | token cookie cleared | token cookie cleared | PASS |
| 18 | 10 old-email notice queued | to member5@uat.pergas.org | to member5@uat.pergas.org | PASS |
| 19 | cleanup: memberC's email restored | member5@uat.pergas.org | member5@uat.pergas.org | PASS |

## Not run

- 4 valid request sends the code to the new email: SMTP_PASSWORD not configured; the server cannot send email
- 11 old email receives the change notice: SMTP_PASSWORD not configured; the notice is queued (step 10) but cannot be delivered
