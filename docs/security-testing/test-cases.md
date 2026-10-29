# Security test cases

One test case per security requirement (SFR-01 to SFR-08, SNFR-01 to SNFR-03),
plus a regression test case for SNFR-04/05. Each step maps to an acceptance
criterion from the requirement's GitHub issue.

How to run the tests, the test accounts and the evidence layout are in
[README.md](README.md). Failed steps go to [defects.md](defects.md).

**Step method**

| Method | Meaning |
|---|---|
| Auto | Automated in `tests/security/`; evidence written on every run |
| Browser | Automated with Playwright in a real browser; screenshot kept as evidence |
| Inspection | Checked by reading code or docs; the file and line are recorded as evidence |
| Not run | Needs something that is not configured (SMTP). Recorded, not silently skipped |

**Accounts** (see README): `memberA` = member3, `memberB` = member4,
`memberC` = member5, `admin` = admin3. All members are basic tier.

**Test data rule:** anything a test creates (events, benefits, posts,
notifications, registrations) is deleted at the end of the test, and any account
change a test makes is restored.

## Summary

Baseline run [`2026-10-29T13-16-06`](evidence/runs/2026-10-29T13-16-06/), 29 Oct 2026, production build: 13 test cases (including the TC-00 harness check), 507 checks, 469 passed, 38 failed, 2 not run (SMTP). Failures are grouped into defects in [defects.md](defects.md).

| ID | Requirement | Owner | Steps | Status |
|---|---|---|---|---|
| [TC-SFR-01](#tc-sfr-01-api-authorisation-and-role-enforcement) | SFR-01 API authorisation and role enforcement (#47) | LiandoMaxin | 6 | PASS |
| [TC-SFR-02](#tc-sfr-02-resource-level-access-control) | SFR-02 Resource-level access control (#48) | nerocladiaus | 7 | PASS |
| [TC-SFR-03](#tc-sfr-03-membership-tier-access-control) | SFR-03 Membership-tier access control (#49) | nerocladiaus | 8 | PASS |
| [TC-SFR-04](#tc-sfr-04-server-side-input-validation-and-sanitisation) | SFR-04 Server-side input validation and sanitisation (#50) | LiandoMaxin | 9 | PASS |
| [TC-SFR-05](#tc-sfr-05-database-access-control) | SFR-05 Database access control (#51) | ooWise | 5 | PASS |
| [TC-SFR-06](#tc-sfr-06-secure-session-and-cross-site-request-handling) | SFR-06 Secure session and cross-site request handling (#52) | nerocladiaus | 9 | **FAIL** |
| [TC-SFR-07](#tc-sfr-07-secure-digital-membership-verification) | SFR-07 Secure digital membership verification (#53) | LiandoMaxin | 8 | PASS |
| [TC-SFR-08](#tc-sfr-08-secure-email-address-change) | SFR-08 Secure email address change (#39) | LiandoMaxin | 11 | PASS (2 not run) |
| [TC-SNFR-01](#tc-snfr-01-secure-session-configuration) | SNFR-01 Secure session configuration (#54) | — | 5 | **FAIL** |
| [TC-SNFR-02](#tc-snfr-02-personal-data-minimisation) | SNFR-02 Personal data minimisation (#55) | LiandoMaxin | 6 | PASS |
| [TC-SNFR-03](#tc-snfr-03-controlled-error-disclosure) | SNFR-03 Controlled error disclosure (#56) | — | 7 | **FAIL** |
| [TC-REG-01](#tc-reg-01-regression-existing-workflows-still-work) | SNFR-04/05 Regression: existing workflows still work (#57) | ooWise | 4 | PASS |

---

## TC-SFR-01 API authorisation and role enforcement

**Requirement:** Verify the identity and assigned role of each authenticated user
before allowing access to protected member or admin API functions.
**Acceptance criteria:** (a) every protected API route checks for a valid
authenticated user; (b) member vs admin role is checked server-side;
(c) unauthorised requests return 401/403.

**Preconditions:** production build running; `memberA` and `admin` log in.
**Test data:** the route inventory in [Appendix A](#appendix-a-api-route-inventory)
(37 admin handlers, 21 member handlers, 2 internal endpoints). Requests use a
valid-shaped body so a missing check can't hide behind a validation error.
**Spec:** `tests/security/tc-sfr-01.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Call every admin handler with no session | 401 on every handler; no data in the body | a, c | Auto |
| 2 | Call every member handler with no session | 401 on every handler | a, c | Auto |
| 3 | Call every admin handler as `memberA` | 403 on every handler | b, c | Auto |
| 4 | Call every member handler as `admin`, except `/api/auth/activity` (any signed-in user, by design) | 403 on every handler (member functions are member-only) | b, c | Auto |
| 5 | Call both internal email endpoints with no secret, and with a wrong bearer secret | 401 for both | a, c | Auto |
| 6 | Send `memberA`'s requests to admin handlers with a correctly signed token that also claims `role: "admin"` | 403: the role is read from the database on every request, never trusted from the token | b | Auto |

**Status:** PASS (153/153 checks) · **Evidence:** [`TC-SFR-01/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-01/) · **Defects:** —

---

## TC-SFR-02 Resource-level access control

**Requirement:** Authenticated users can access or modify only the resources they
are authorised for.
**Acceptance criteria:** (a) ownership checks on member data (profile,
registrations, posts); (b) a member cannot read or edit another member's data by
changing an ID; (c) tested with two different accounts.

**Preconditions:** `memberA` and `memberB` log in.
**Test data (created, then deleted):** one unread notification for `memberB`;
one `memberB` event registration on a published all-tier event; one pending
discussion thread by `memberB`.
**Spec:** `tests/security/tc-sfr-02.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | `memberA` sends `PATCH /api/member/profile` with `memberB`'s id in the body (`id`, `user_id`) | Only `memberA`'s profile changes; `memberB`'s row is unchanged in the database | a, b, c | Auto |
| 2 | `memberA` marks `memberB`'s notification as read by its id (`PATCH /api/member/notifications`) | No change to `memberB`'s notification (still unread); response does not reveal it exists | a, b, c | Auto |
| 3 | `memberA` calls `GET /api/member/notifications` | Only `memberA`'s notifications; none of `memberB`'s | a, c | Auto |
| 4 | `memberA` cancels the event `memberB` registered for (`DELETE /api/events/rsvp`) | Only `memberA`'s own registration (if any) is affected; `memberB`'s registration still exists | a, b, c | Auto |
| 5 | `memberA` opens `memberB`'s pending thread by URL (`/member/community/<threadId>`) | Not-found screen shown, and the thread's content is not in the page source; pending posts are visible only to their author | a, b, c | Browser |
| 6 | `memberA` calls `GET /api/member/tier-upgrade` | Only `memberA`'s own requests | a, c | Auto |
| 7 | `memberA` requests a membership QR (`GET /api/member/qr-token`) and verifies it | The verified identity is `memberA`; there is no parameter that selects another member | a, b | Auto |

**Status:** PASS (8/8) · **Evidence:** [`TC-SFR-02/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-02/) · **Defects:** —

---

## TC-SFR-03 Membership-tier access control

**Requirement:** Enforce tier restrictions on functions and resources limited to
specific membership tiers. Linked to UC-11 (#18) and UC-12 (#19).
**Acceptance criteria:** (a) tier-restricted benefits and events are checked
server-side; (b) lower-tier users are blocked even if they call the API directly.

**Preconditions:** `admin`, `memberA` (basic) and `memberC` log in.
**Test data (created through the admin API, then deleted):**
- Event E1: published, open to `basic` (allowed for basic members)
- Event E2: published, restricted to `ordinary`, no locked preview
- Benefit B1: active, restricted to `ordinary`
- For step 7, `memberC`'s expiry date is set to yesterday, then restored

**Spec:** `tests/security/tc-sfr-03.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | `memberA` registers for E1 via `POST /api/events/rsvp` | 200, registered (control: allowed tiers still work) | a | Auto |
| 2 | `memberA` registers for E2 via `POST /api/events/rsvp` directly | 403 "not available for your membership tier"; no registration row created | a, b | Auto |
| 3 | `memberA` requests E2's RSVP link via `GET /api/events/rsvp?eventId=E2` | 404, no external link revealed | a, b | Auto |
| 4 | `memberA` opens `/member/events/<E2>` | Event details not shown (not found or locked) | a | Browser |
| 5 | `memberA` opens `/member/events` | E2 not listed (no locked preview) | a | Browser |
| 6 | `memberA` opens `/member/benefit` | B1 not listed, and its details are not in the page source | a | Browser |
| 7 | `memberC` (membership expired) registers for E1 | 403; an expired membership loses tier access even for allowed tiers | a, b | Auto |
| 8 | `memberA` posts to a discussion group restricted to `ordinary` via `POST /api/community/threads` | 403 or 404 (group hidden); no thread created | a, b | Auto |

**Status:** PASS (8/8) · **Evidence:** [`TC-SFR-03/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-03/) · **Defects:** —

---

## TC-SFR-04 Server-side input validation and sanitisation

**Requirement:** Validate all user input on the server for type, format, length
and permitted values before processing or storage, and sanitise where needed.
**Acceptance criteria:** (a) validation schema on every endpoint that accepts
input; (b) discussion posts and comments are sanitised against XSS; (c) invalid
input returns a clear 400 error.

**Preconditions:** `memberA` and `admin` log in.
**Approach:** the portal rejects HTML markup in user text (it does not strip it),
and React escapes everything it displays. Both halves are tested.
**Spec:** `tests/security/tc-sfr-04.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Send malformed JSON, a JSON array, and an empty body to every input-accepting handler in Appendix A | 400 with a clear message on every handler; nothing stored | a, c | Auto |
| 2 | Send wrong types (number for text, string for number, object for UUID) to each handler | 400 naming the bad field | a, c | Auto |
| 3 | Send over-length values (e.g. 801-character post, 81-character title, 255-character email) | 400 "cannot exceed N characters" | a, c | Auto |
| 4 | Send values outside the permitted set (unknown tier, status, salutation, action) | 400 "must be one of …" | a, c | Auto |
| 5 | Post a thread and a comment containing `<script>alert(1)</script>` | 400 "must be plain text without HTML markup"; nothing stored | b, c | Auto |
| 6 | Same with `<img src=x onerror=alert(1)>`, `<svg/onload=alert(1)>` and `<!--x-->` | 400 for each | b, c | Auto |
| 7 | Post text that is not markup but contains `<`, `>` and `"` (e.g. `a < b && c > "d"`), then view it as the author | Accepted; shown literally as text; no script runs (no dialog, no new DOM elements) | b | Browser |
| 8 | Admin creates an event with `javascript:` and `data:` RSVP URLs | 400 "must be an HTTP or HTTPS URL" | a, c | Auto |
| 9 | Inventory check: every handler that reads a body or query parameter calls a validator | Every input-accepting handler in Appendix A validates before use | a | Inspection |

**Status:** PASS (155/155) · **Evidence:** [`TC-SFR-04/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-04/) · **Defects:** —

---

## TC-SFR-05 Database access control

**Requirement:** Enforce database restrictions through server-side authorisation
and Row-Level Security policies, especially where privileged Supabase access is
used.
**Acceptance criteria:** (a) RLS enabled on all tables; (b) policies written and
tested per table; (c) service-role key is used only server-side and only where
needed.

**Preconditions:** `docs/supabase-sfr05-rls.sql` applied; `SUPABASE_ANON_KEY` set.
**Spec:** the existing SFR-05 suites (`npm run test:sfr05`), plus
`tests/security/tc-sfr-05.spec.ts` for steps 3–5.

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Run `npm run test:sfr05:rls`: as the anonymous role, read every private table and attempt writes | No rows from any private table; public tables show only published, open-to-all items; all writes rejected | a, b | Auto |
| 2 | Run `npm run test:sfr05:authz` and `npm run test:sfr05:workflows` | All pass | b | Auto |
| 3 | Search the browser bundle (`.next/static`) and every page's HTML for the service-role key and `supabaseAdmin` | Not found | c | Auto |
| 4 | Confirm the key is read only in `lib/supabaseServer.ts`, never from a `NEXT_PUBLIC_*` variable, and the module throws in a browser | True | c | Inspection |
| 5 | Search every committed file for the UAT test-account password (added after DEF-01) | Not found; tests read it from `UAT_PASSWORD` in `.env.local` | c | Auto |

**Status:** PASS (14/14 at baseline) · **Evidence:** [`TC-SFR-05/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-05/) · **Retest after DEF-01:** PASS (15/15, with step 5) [`TC-SFR-05/`](evidence/runs/2026-10-29T15-28-54/TC-SFR-05/) · **Defects:** [DEF-01](defects.md#def-01) (found by inspection, fixed)

---

## TC-SFR-06 Secure session and cross-site request handling

**Requirement:** Validate active sessions for protected operations and prevent
unauthorised cross-site state-changing requests.
**Acceptance criteria:** (a) session is validated on every state-changing
operation; (b) CSRF protection or an equivalent control (e.g. Origin check,
SameSite) is in place; (c) expired or invalid sessions are rejected.

**Preconditions:** `memberA` logs in. `JWT_SECRET` is available to the test so it
can build expired and forged tokens.
**State-changing request used:** `PATCH /api/member/notification-preferences`
(harmless, and reset after each step).
**Spec:** `tests/security/tc-sfr-06.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Send the request with the token's signature altered | 401 | a, c | Auto |
| 2 | Send it with a token signed with a different secret, and with an unsigned (`alg: none`) token | 401 for both | a, c | Auto |
| 3 | Send it with a correctly signed token whose expiry has passed | 401 | a, c | Auto |
| 4 | Send it with a valid token but `last_activity` older than the 15-minute idle timeout | 401 and session cookies cleared | a, c | Auto |
| 5 | Log out, then reuse the old token | 401 | a, c | Auto |
| 6 | Send it with a valid session and `Origin: https://evil.example` | 403 (cross-site request refused) | b | Auto |
| 7 | Inspect the session cookie's `SameSite` attribute | `SameSite=Lax` or `Strict` set explicitly | b | Auto |
| 8 | From a page on another site (`127.0.0.1`), have the browser send a cross-site script request (8a) and submit a cross-site form (8b) to the portal (`localhost`) with credentials. Control 8c: the same form from the portal's own site | 8a, 8b: no state change. 8c: state changes, proving the test can detect a successful request | b | Browser |
| 9 | Confirm a valid session still works for the same request (control) | 200 | a | Auto |

**Status:** FAIL (9/14; steps 4, 5, 6, 7 fail) · **Evidence:** [`TC-SFR-06/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-06/) · **Defects:** [DEF-02](defects.md#def-02), [DEF-03](defects.md#def-03), [DEF-04](defects.md#def-04), [DEF-05](defects.md#def-05)

---

## TC-SFR-07 Secure digital membership verification

**Requirement:** Provide a tamper-resistant digital membership verification
mechanism with minimal personal data in the QR payload.
**Acceptance criteria:** (a) QR payload is signed or uses an opaque token;
(b) no unnecessary personal data in the payload; (c) tampered or expired QR codes
fail verification.

**Preconditions:** `MEMBERSHIP_QR_SECRET` set; `memberA` logs in.
**Spec:** `tests/security/tc-sfr-07.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | `memberA` requests a QR (`GET /api/member/qr-token`) and decodes the token | Signed HS256 token; payload holds only `memberId`, `purpose`, `iat`, `exp`; 5-minute lifetime | a, b | Auto |
| 2 | Verify the fresh token (`GET /api/verify/member?token=…`) | `valid: true`; response holds only display name (first name + last initial), tier, status and expiry | a, b | Auto |
| 3 | Change one character of the payload and verify | `valid: false`, "Invalid Membership QR" | c | Auto |
| 4 | Change one character of the signature and verify | `valid: false` | c | Auto |
| 5 | Verify a token signed with the right secret but expired | `valid: false`, "QR Expired" | c | Auto |
| 6 | Verify a token signed with the wrong secret, one with the wrong `purpose`, and the member's session JWT | `valid: false` for each (a session token is not a QR token) | a, c | Auto |
| 7 | Check the QR responses' headers | `Cache-Control: no-store`, `Referrer-Policy: no-referrer` | b | Auto |
| 8 | Open the verify page with a valid and a tampered token | Valid shows the member card; tampered shows "Invalid Membership QR" | c | Browser |

**Status:** PASS (16/16) · **Evidence:** [`TC-SFR-07/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-07/) · **Defects:** —

---

## TC-SFR-08 Secure email address change

**Requirement:** Require re-authentication, validation, and OTP verification
before changing a member's email.
**Acceptance criteria:** (a) member must re-authenticate first; (b) new email
validated for format and uniqueness; (c) OTP sent to the new email and verified
before the change completes; (d) old email notified after a successful change.

**Preconditions:** `EMAIL_CHANGE_SECRET` set; `memberC` logs in. `memberC` is used
only by this test case so its request limit (10 per hour) is not shared.
**SMTP is not configured.** The portal cannot send the OTP email, so steps that
need delivery are marked Not run. To still test the OTP check itself, steps 7–10
create the pending request directly in the database with a known code (hashed
with the same secret the server uses), which is what the server would have done
before sending the email.
**Spec:** `tests/security/tc-sfr-08.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Request a change with no current password, then with a wrong password | 401 "Invalid credentials"; no request created | a | Auto |
| 2 | Request with an invalid email format | 400 "Enter a valid new email address" | b | Auto |
| 3 | Request with an email already used by another account (`memberA`'s) | 409 "already registered" | b | Auto |
| 4 | Request with a valid new email and the correct password | Code sent, 200 | a, c | Not run (SMTP) |
| 5 | Request without an `Origin` header, and with a foreign `Origin` | 403 | a | Auto |
| 6 | Request as `admin` | 403 (members only) | a | Auto |
| 7 | Verify with a wrong code | 400, change not made; attempt counted | c | Auto |
| 8 | Verify with 5 wrong codes, then the correct one | 429 "Too many incorrect attempts"; change not made | c | Auto |
| 9 | Verify with the correct code after the request has expired | 400 "expired"; change not made | c | Auto |
| 10 | Verify with the correct code within the time limit | 200; email changed; session ended; a notification for the old email is queued. Email restored afterwards | c, d | Auto |
| 11 | The old email address actually receives the change notice | Notice delivered | d | Not run (SMTP) |

**Status:** PASS (19/19; steps 4 and 11 not run, SMTP not configured) · **Evidence:** [`TC-SFR-08/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-08/) · **Defects:** —

---

## TC-SNFR-01 Secure session configuration

**Requirement:** Production auth cookies use HttpOnly, Secure and SameSite, and
tokens have a defined maximum validity.
**Acceptance criteria:** (a) cookie flags set in production; (b) token expiry
configured and documented.

**Preconditions:** production build (`next start`), so production cookie settings
apply.
**Spec:** `tests/security/tc-snfr-01.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Log in and read the `Set-Cookie` header for `token` | `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, `Path=/`, a `Max-Age` | a | Auto |
| 2 | Read the `Set-Cookie` header for `last_activity` | `HttpOnly`, `Secure`, `SameSite` | a | Auto |
| 3 | Check the cookies from `/api/auth/register` and `/api/auth/logout` | Same flags as step 1 (logout clears with matching attributes) | a | Auto |
| 4 | Decode a session token | `exp` is set; lifetime equals the configured maximum (7 days) and matches the cookie `Max-Age` | b | Auto |
| 5 | Check the documentation | Session lifetime (7 days) and idle timeout (15 minutes) are documented | b | Inspection |

**Status:** FAIL (3/9; steps 1, 2, 3, 5 fail) · **Evidence:** [`TC-SNFR-01/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-01/) · **Defects:** [DEF-05](defects.md#def-05), [DEF-06](defects.md#def-06)

---

## TC-SNFR-02 Personal data minimisation

**Requirement:** Expose only the minimum personal data needed in API responses,
the QR payload and other client-visible outputs. Linked to SFR-07.
**Acceptance criteria:** (a) audit API responses for unneeded fields (e.g. email,
phone, IDs); (b) select only the required columns in queries.

**Preconditions:** `memberA`, `memberB` and `admin` log in.
**Spec:** `tests/security/tc-snfr-02.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Call every member-facing GET API and compare each response's fields to an allowlist | No unexpected personal fields; never `password_hash`, other members' emails, phones or ids | a | Auto |
| 2 | QR token payload and `/api/verify/member` response | Only the fields listed in TC-SFR-07 steps 1–2 | a | Auto |
| 3 | Load member pages (`/member`, `/member/community`, a thread page, `/member/events`) as `memberA` and scan the HTML and page data | No other member's email, phone, `password_hash`, or tier/expiry details | a | Browser |
| 4 | Error and success responses of login, register and email change | Do not reveal whether an account exists beyond what the flow needs (e.g. login says "Invalid credentials" for both unknown email and wrong password) | a | Auto |
| 5 | Admin member list and member detail | No `password_hash` in any admin response | a | Auto |
| 6 | Review queries in member-facing code paths for `select("*")` or selecting `password_hash` outside authentication | Explicit column lists; `password_hash` only in login, password change and email change | b | Inspection |

**Status:** PASS (23/23) · **Evidence:** [`TC-SNFR-02/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-02/) · **Defects:** —

---

## TC-SNFR-03 Controlled error disclosure

**Requirement:** Production errors must not reveal secrets, database details,
stack traces or internal implementation.
**Acceptance criteria:** (a) generic error messages returned to clients;
(b) detailed errors logged server-side only; (c) checked with deliberately
triggered failures.

**Preconditions:** production build.
**Leak patterns checked in every error body:** stack frames (`at …(`, file paths),
`node_modules`, `.next/`, SQL and Postgres terms (`PGRST`, `postgres`,
`relation`, `violates`, `syntax error`), Supabase URLs, secret names, and the
values of secrets from `.env.local`.
**Spec:** `tests/security/tc-snfr-03.spec.ts`

| # | Step | Expected result | Criterion | Method |
|---|---|---|---|---|
| 1 | Trigger malformed JSON, wrong types and invalid UUIDs across the APIs | 400 with a generic, field-level message; no leak patterns | a, c | Auto |
| 2 | Request ids that do not exist (events, announcements, members, notifications) | 404 or no-op; no leak patterns | a, c | Auto |
| 3 | Send an oversized body (1 MB) and a request with a wrong `Content-Type` | Handled with a generic error; no leak patterns | a, c | Auto |
| 4 | Verify garbage QR tokens and call internal endpoints with bad secrets | Generic error; no leak patterns | a, c | Auto |
| 5 | Open an unknown page and an unknown API path | Generic 404 page; no stack trace or framework detail | a, c | Browser |
| 6 | Response headers across steps 1–5 | No `X-Powered-By`, no server version headers | a | Auto |
| 7 | Review API error handling in every route file | No handler returns `error.message` or raw database errors to the client, and every route that can return a 5xx logs the error server-side | a, b | Inspection |

**Status:** FAIL (33/60; steps 6, 7 fail) · **Evidence:** [`TC-SNFR-03/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-03/) · **Defects:** [DEF-07](defects.md#def-07), [DEF-08](defects.md#def-08)

---

## TC-REG-01 Regression: existing workflows still work

**Requirement:** SNFR-04/05. Defects are retested after remediation, and existing
workflows are confirmed still working.
**When:** after every fix (steps 1–2 for the affected test case), and once in full
at the end (steps 1–4).

| # | Step | Expected result | Method |
|---|---|---|---|
| 1 | Rerun the test case whose defect was fixed | The failing step now passes; the before and after evidence are both kept | Auto |
| 2 | Run `npm run test:security` (all test cases) | No new failures | Auto |
| 3 | Run `npm run test:sfr05` (RLS, authorisation, member and admin workflows) | All pass | Auto |
| 4 | Member and admin journeys in the browser: log in, view home, events, benefits, community, profile, digital card; admin dashboard, members, events | Every page loads and works; screenshots kept | Browser |

**Status:** PASS (21/21 pages) · **Evidence:** [`TC-REG-01/`](evidence/runs/2026-10-29T13-16-06/TC-REG-01/) · **Defects:** —

---

## Appendix A: API route inventory

Expected authorisation for every API handler, used by TC-SFR-01 and TC-SFR-04.

**Admin (37 handlers): anonymous → 401, member → 403, admin → allowed**

| Route | Methods |
|---|---|
| `/api/admin/analytics` | GET |
| `/api/admin/announcements` | GET, POST |
| `/api/admin/announcements/[id]` | GET, PATCH, DELETE |
| `/api/admin/announcements/[id]/poll-responses` | GET |
| `/api/admin/batch-onboarding` | POST |
| `/api/admin/comment-moderation` | PATCH |
| `/api/admin/dashboard` | GET |
| `/api/admin/discussion-groups` | GET, PATCH |
| `/api/admin/engagement` | GET, POST |
| `/api/admin/engagement/[id]` | GET, PATCH, DELETE |
| `/api/admin/events` | GET, POST |
| `/api/admin/events/[id]` | GET, PATCH, DELETE |
| `/api/admin/events/[id]/registrations` | GET, DELETE |
| `/api/admin/members` | GET |
| `/api/admin/members/[id]` | GET, PATCH |
| `/api/admin/payment-methods` | GET, POST |
| `/api/admin/payment-methods/[id]` | GET, PATCH, DELETE |
| `/api/admin/team` | GET |
| `/api/admin/tier-requests` | GET, PATCH |
| `/api/admin/upload` | POST |

**Member (21 handlers): anonymous → 401, admin → 403, member → allowed**

| Route | Methods | Note |
|---|---|---|
| `/api/analytics/track` | POST | |
| `/api/community/announcement-comments` | POST | |
| `/api/community/announcement-poll` | POST | |
| `/api/community/thread-comments` | POST | |
| `/api/community/threads` | POST | |
| `/api/events/rsvp` | GET, POST, DELETE | |
| `/api/member/change-password` | PATCH | |
| `/api/member/email-change/request` | POST | Also requires same-origin `Origin` |
| `/api/member/email-change/verify` | POST | Also requires same-origin `Origin` |
| `/api/member/notification-preferences` | GET, PATCH | |
| `/api/member/notifications` | GET, PATCH, DELETE | |
| `/api/member/profile` | PATCH | |
| `/api/member/qr-token` | GET | Checks the session directly, not with `requireMember()` |
| `/api/member/tier-upgrade` | GET, POST | |
| `/api/auth/activity` | POST | Any signed-in user (member or admin) |

**Internal (2 handlers): bearer secret required → 401 without it**

| Route | Methods | Secret |
|---|---|---|
| `/api/internal/email-change-notifications` | POST | `EMAIL_NOTIFICATION_CRON_SECRET` |
| `/api/internal/transactional-emails` | POST | `TRANSACTIONAL_EMAIL_WORKER_SECRET` |

**Public by design (4 handlers): no session required**

| Route | Methods | Why public |
|---|---|---|
| `/api/auth/login` | POST | Signing in |
| `/api/auth/register` | POST | Creating an account |
| `/api/auth/logout` | POST | Clears cookies only |
| `/api/verify/member` | GET | QR verification by a third party; needs a valid signed QR token |
