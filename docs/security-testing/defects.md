# Defect log

Failed security checks found by the SNFR-04/05 test cases. Workflow and status
meanings are in [README.md](README.md#defect-workflow).

Status: `Open` → `Confirmed` / `Rejected` → `Fixed` → `Closed`

**Baseline run:** [`evidence/runs/2026-10-29T13-16-06/`](evidence/runs/2026-10-29T13-16-06/)
(13 test cases, 507 checks: 469 passed, 38 failed, 2 not run for SMTP).
Several failed checks share one cause, so the 38 failures are grouped into the
defects below. Owners are the requirement owners from GitHub, to confirm offline.

**Retest run:** [`evidence/runs/2026-11-08T13-33-05/`](evidence/runs/2026-11-08T13-33-05/), after merging `main` with
nerocladiaus's fix `29f5b43` (509 checks: 479 passed, 30 failed, 2 not run for
SMTP). DEF-02, DEF-04 and DEF-05 are closed; the remaining failures are DEF-03,
DEF-06, DEF-07 and DEF-08.

**Retest run:** [`evidence/runs/2026-11-08T13-49-21/`](evidence/runs/2026-11-08T13-49-21/), after fixing DEF-07 and DEF-08
on this branch (509 checks: 506 passed, 3 failed, 2 not run for SMTP). DEF-07 and
DEF-08 are closed. The 3 remaining failures are DEF-03 (nerocladiaus) and DEF-06.

**Retest run:** [`evidence/runs/2026-11-08T13-55-11/`](evidence/runs/2026-11-08T13-55-11/), TC-SNFR-01 only, after
documenting sessions for DEF-06 (9/9 pass). DEF-06 is closed; DEF-03 is the only
open defect.

**Final retest run:** [`evidence/runs/2026-11-08T14-20-36/`](evidence/runs/2026-11-08T14-20-36/), after fixing DEF-03
(511 checks: 511 passed, 0 failed, 2 not run for SMTP). **All defects are closed.**

**Final regression run:** [`evidence/runs/2026-11-08T14-46-23/`](evidence/runs/2026-11-08T14-46-23/), including TC-REG-02
(admin and member save actions): 539 checks, 539 passed, 0 failed, 2 not run for SMTP.

## Summary

| ID | Severity | Requirement (owner) | Defect | Status |
|---|---|---|---|---|
| [DEF-01](#def-01) | Medium | SFR-05 (ooWise) | UAT account password hardcoded in public test files | Closed |
| [DEF-02](#def-02) | Medium | SFR-06 (nerocladiaus) | APIs accept sessions past the 15-minute idle timeout | Closed |
| [DEF-03](#def-03) | Medium | SFR-06 (nerocladiaus) | Session token still works after logout | Closed |
| [DEF-04](#def-04) | Medium | SFR-06 (nerocladiaus) | No Origin check on state-changing API requests | Closed |
| [DEF-05](#def-05) | Medium | SNFR-01 (unassigned), SFR-06 | Session cookies missing `Secure` and `SameSite` | Closed |
| [DEF-06](#def-06) | Low | SNFR-01 (unassigned) | Session lifetime and idle timeout not documented | Closed |
| [DEF-07](#def-07) | Low | SNFR-03 (unassigned) | `X-Powered-By: Next.js` header reveals the framework | Closed |
| [DEF-08](#def-08) | Low | SNFR-03 (unassigned) | 26 API routes return 5xx errors without logging them | Closed |

Severity: **High** = exploitable now with real impact; **Medium** = a security
control the requirement asks for is missing, but another layer limits the impact;
**Low** = hardening or operational gap.

---

### DEF-01

**UAT account password hardcoded in public test files** · Medium · Closed

- **Found by:** code inspection during setup (not a test case).
- **What:** the shared UAT password is in `tests/test-server-authorization.mjs`
  (lines 9, 14) and `tests/test-workflow-regression.mjs` (lines 8, 13, 18). The
  repository is public, so anyone can sign in as these member and admin test
  accounts on any deployment that uses this database.
- **Suggested fix:** read it from `UAT_PASSWORD` in `.env.local`, as
  `tests/security/` does, and change the UAT accounts' password, since the current
  one is already in the git history.
- **Fix:** commit `d5d6954`. Both files now read the password from `UAT_PASSWORD`
  and stop with a clear message if it is missing; the `test:sfr05:authz` and
  `test:sfr05:workflows` scripts load `.env.local`. TC-SFR-05 gained step 5, which
  fails if any committed file contains the UAT password (the same check run
  against the previous commit, `1df41d1`, finds both files).
- **Retest evidence:** [`TC-SFR-05/`](evidence/runs/2026-10-29T15-28-54/TC-SFR-05/) (run 2026-10-29T15-28-54):
  15/15 pass, including step 5 (0 files contain the password) and all three SFR-05
  suites running with the password from `.env.local`.
- **Closed 8 Nov 2026:** the code fix is retested (above). The old password is still
  in the repository's git history, so the UAT accounts' password is to be changed,
  after which `UAT_PASSWORD` is updated in each `.env.local`.

### DEF-02

**APIs accept sessions past the 15-minute idle timeout** · Medium · Closed

- **Found by:** TC-SFR-06 step 4.
- **Evidence:** [`TC-SFR-06/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-06/) checks 5–6:
  a valid token with `last_activity` 16 minutes old gets **200** on
  `PATCH /api/member/notification-preferences` (expected 401), and the cookies are
  not cleared.
- **Cause:** the idle timeout is only checked by page navigation (`proxy.ts`),
  `/api/auth/activity`, `/api/member/qr-token` and email change.
  `getCurrentUser()` / `requireMember()` / `requireAdmin()` in `lib/currentUser.ts`
  never check `last_activity`, so every other API ignores it.
- **Suggested fix:** check `last_activity` inside `getCurrentUser()` (one place),
  returning no user when it is older than `SESSION_IDLE_TIMEOUT_MS`.
- **Fix:** commit `29f5b43` on `main` ("fix(security): enforce session expiry and CSRF protection", nerocladiaus, 3 Nov 2026), merged into this branch. `getCurrentUser()` now rejects a session whose
  `last_activity` is missing or older than 15 minutes, and the 401 clears the
  session cookies.
- **Retest evidence:** [`TC-SFR-06/`](evidence/runs/2026-11-08T13-33-05/TC-SFR-06/) checks 5–6 pass: the
  16-minute idle session gets 401 and its cookies are cleared.
- **Note:** `last_activity` is an unsigned cookie, so the timeout protects an
  unattended browser but not someone holding a copied token, who can set the
  cookie themselves. That remaining risk is covered by DEF-03.

### DEF-03

**Session token still works after logout** · Medium · Closed

- **Found by:** TC-SFR-06 step 5.
- **Evidence:** [`TC-SFR-06/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-06/) check 8:
  after `POST /api/auth/logout`, the old token gets **200** (expected 401).
- **Cause:** logout only clears the browser's cookies (`app/api/auth/logout/route.ts`).
  The JWT itself stays valid until it expires 7 days after login, so a copied or
  stolen token keeps working after the member logs out.
- **Suggested fix:** give each user a session version (e.g. a `session_version`
  column on `users`, included in the JWT). Logout and password change increment it,
  and `getCurrentUser()` rejects tokens with an older version. Needs a small
  database migration.
- **Retest after `29f5b43`:** [`TC-SFR-06/`](evidence/runs/2026-11-08T13-33-05/TC-SFR-06/) check 8 still
  fails: the logged-out token, sent with a fresh `last_activity`, gets **200**.
  `29f5b43` did not change logout. Because the new idle timeout trusts the
  unsigned `last_activity` cookie, server-side revocation is now also what stops a
  copied token from outliving the idle timeout.
- **Fix:** commit `b26dbcb`. Per-session server-side logout. Every session token now has its own ID (`jti`, set in
  `lib/auth.ts`). Logout adds "<id>:<expiry>" to a new `users.revoked_sessions`
  column (`docs/supabase-session-revocation.sql`, applied to the UAT database
  8 Nov 2026) and prunes expired entries. `getCurrentUser()`, the QR endpoint and
  email change reject revoked sessions using the user row they already load, so
  there is no extra query. Logging out on one device leaves the member's other
  devices signed in. The suggested `session_version` design above was not used
  because it would sign a member out everywhere; a sessions table was avoided to
  keep the change small.
- **Known limits:** a session can only be ended from the device that holds it
  (there is no list of active devices to end one remotely). Tokens issued before
  this change have no ID and simply expire within 7 days.
- **Retest evidence:** [`TC-SFR-06/`](evidence/runs/2026-11-08T14-20-36/TC-SFR-06/) step 5 passes: the same
  token gets 200 before logout and 401 after (sent with a fresh `last_activity`),
  and the member's other session still gets 200.

### DEF-04

**No Origin check on state-changing API requests** · Medium · Closed

- **Found by:** TC-SFR-06 step 6.
- **Evidence:** [`TC-SFR-06/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-06/) check 9:
  a valid session with `Origin: https://evil.example` gets **200** (expected 403).
- **Context:** steps 8a–8c show that Chromium currently blocks real cross-site
  requests (the session cookie is not sent), and control 8c proves the test would
  have caught it. That protection comes from the browser's default handling of
  cookies without `SameSite`, not from the portal. Browsers or settings that don't
  apply that default would allow cross-site requests.
- **Cause:** only the email-change routes check `Origin` (`lib/emailChangeServer.ts`).
- **Suggested fix:** one check in `proxy.ts` for every non-GET `/api/` request
  (excluding the internal bearer-secret endpoints): reject with 403 when `Origin`
  is present and not the portal's own origin. Together with DEF-05's explicit
  `SameSite=Lax`, this meets SFR-06's "CSRF protection or an equivalent control".
- **Fix:** commit `29f5b43` on `main` ("fix(security): enforce session expiry and CSRF protection", nerocladiaus, 3 Nov 2026), merged into this branch. `proxy.ts` now runs on `/api/*` and rejects every
  non-GET request whose `Origin` is missing or not the portal's own origin
  (`lib/requestSecurity.ts`), except the two internal bearer-secret endpoints.
- **Retest evidence:** [`TC-SFR-06/`](evidence/runs/2026-11-08T13-33-05/TC-SFR-06/) checks 9–10 pass: a
  foreign `Origin` and a missing `Origin` both get 403. The test case gained the
  missing-`Origin` check for this retest.

### DEF-05

**Session cookies missing `Secure` and `SameSite`** · Medium · Closed

- **Found by:** TC-SNFR-01 steps 1–3 and TC-SFR-06 step 7.
- **Evidence:** [`TC-SNFR-01/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-01/) checks 1, 2, 4, 5
  and its `http.log` (raw `Set-Cookie` headers, values redacted), and
  [`TC-SFR-06/`](evidence/runs/2026-10-29T13-16-06/TC-SFR-06/) check 10:
  - `token` (login and register): `HttpOnly` only; no `Secure`, no `SameSite`.
  - `last_activity`: `HttpOnly; SameSite=lax`; no `Secure`.
  - logout clears `token` with `HttpOnly` only.
- **Cause:** `res.cookies.set('token', …, { httpOnly: true, path: '/', maxAge })` in
  `app/api/auth/login/route.ts` and `app/api/auth/register/route.ts`;
  `lib/session.ts` sets no `secure` flag.
- **Suggested fix:** one shared cookie options object in `lib/session.ts`
  (`httpOnly: true, secure: true, sameSite: "lax", path: "/"`), used by login,
  register, logout and `setLastActivityCookie`. Browsers accept `Secure` cookies
  on `http://localhost`, so local development keeps working.
- **Fix:** commit `29f5b43` on `main` ("fix(security): enforce session expiry and CSRF protection", nerocladiaus, 3 Nov 2026), merged into this branch. One shared set of cookie options in
  `lib/sessionPolicy.ts` (`httpOnly`, `sameSite: "lax"`, `secure` in production,
  `path`, `maxAge`) used by login, register, logout and `last_activity`.
- **Retest evidence:** [`TC-SNFR-01/`](evidence/runs/2026-11-08T13-33-05/TC-SNFR-01/) checks 1, 2, 4, 5 and
  [`TC-SFR-06/`](evidence/runs/2026-11-08T13-33-05/TC-SFR-06/) check 11 pass. Login now sets
  `token=…; Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=lax` (see `http.log`).

### DEF-06

**Session lifetime and idle timeout not documented** · Low · Closed

- **Found by:** TC-SNFR-01 step 5 (inspection).
- **Evidence:** [`TC-SNFR-01/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-01/) checks 8–9.
  No Markdown file in the repository mentions the 7-day token lifetime or the
  15-minute idle timeout.
- **Suggested fix:** a short "Sessions" section in `docs/setup.md`: token lifetime
  (7 days, `lib/auth.ts`), idle timeout (15 minutes, `lib/sessionPolicy.ts`), cookie flags.
- **Retest after `29f5b43`:** [`TC-SNFR-01/`](evidence/runs/2026-11-08T13-33-05/TC-SNFR-01/) checks 8–9 still
  fail; `29f5b43` added a sentence on CSRF to `docs/setup.md` but nothing on session
  lifetime or the idle timeout.
- **Fix:** commit `ee63858`. A "Sessions" section in `docs/setup.md`: 7-day
  session lifetime, 15-minute idle timeout, cookie flags, the same-origin rule for
  state-changing requests, and where each is configured.
- **Retest evidence:** [`TC-SNFR-01/`](evidence/runs/2026-11-08T13-55-11/TC-SNFR-01/) 9/9 pass; checks 8–9
  find both in `docs/setup.md`.

### DEF-07

**`X-Powered-By: Next.js` header reveals the framework** · Low · Closed

- **Found by:** TC-SNFR-03 step 6.
- **Evidence:** [`TC-SNFR-03/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-03/) check 23.
  Sent on page responses and 404s (JSON API responses don't include it).
- **Suggested fix:** `poweredByHeader: false` in `next.config.ts`.
- **Retest after `29f5b43`:** still fails ([`TC-SNFR-03/`](evidence/runs/2026-11-08T13-33-05/TC-SNFR-03/) check 23).
- **Fix:** commit `2a642ed`. `poweredByHeader: false` in `next.config.ts` (the
  option is unchanged in Next.js 16.2.7, per its bundled docs).
- **Retest evidence:** [`TC-SNFR-03/`](evidence/runs/2026-11-08T13-49-21/TC-SNFR-03/) check 23 passes: no
  `X-Powered-By` header on any of the 21 responses checked.

### DEF-08

**26 API routes return 5xx errors without logging them** · Low · Closed

- **Found by:** TC-SNFR-03 step 7 (inspection).
- **Evidence:** [`TC-SNFR-03/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-03/) checks 25–60
  cover the 36 route files that can return 5xx; the 26 failing ones are listed there. Clients correctly get generic messages (steps 1–5 found no
  leaks), but in these routes the server logs nothing, so the cause of a failure
  is lost. SNFR-03 asks for "detailed errors logged server-side only".
- **Context:** several of these logs were removed in commit `06a7814` ("simplify
  error logging").
- **Suggested fix:** a small helper (e.g. `logServerError(operation, error)`) that
  logs the operation name and the database error code, without request bodies or
  personal data, called on each 5xx path.
- **Retest after `29f5b43`:** still fails for the same 26 routes ([`TC-SNFR-03/`](evidence/runs/2026-11-08T13-33-05/TC-SNFR-03/)).
- **Fix:** commit `2a642ed`. New `lib/serverLog.ts` with
  `logServerError(operation, error)`, called before each of the 58 unlogged 5xx
  responses in the 26 routes. It follows the email-change code's existing rule: log
  the operation and the Postgres/PostgREST code (or the error class name), never
  the raw message, which can contain personal data such as an email address.
  Bare `catch {}` blocks on those paths now name the error so it can be logged.
  Clients still get the same generic messages.
- **Test change:** step 7 was too lenient (a file passed if it logged anywhere).
  It now checks that **each** 5xx response has a log call just before it. Run on
  the code before this fix it reports 58 unlogged responses in 26 files; after, 0
  of 75.
- **Retest evidence:** [`TC-SNFR-03/`](evidence/runs/2026-11-08T13-49-21/TC-SNFR-03/): 60/60 pass, every
  route file's 5xx responses log.
