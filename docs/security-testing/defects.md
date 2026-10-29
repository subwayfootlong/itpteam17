# Defect log

Failed security checks found by the SNFR-04/05 test cases. Workflow and status
meanings are in [README.md](README.md#defect-workflow).

Status: `Open` → `Confirmed` / `Rejected` → `Fixed` → `Closed`

**Baseline run:** [`evidence/runs/2026-10-29T13-16-06/`](evidence/runs/2026-10-29T13-16-06/)
(13 test cases, 507 checks: 469 passed, 38 failed, 2 not run for SMTP).
Several failed checks share one cause, so the 38 failures are grouped into the
defects below. Owners are the requirement owners from GitHub, to confirm offline.

## Summary

| ID | Severity | Requirement (owner) | Defect | Status |
|---|---|---|---|---|
| [DEF-01](#def-01) | Medium | SFR-05 (ooWise) | UAT account password hardcoded in public test files | Fixed (password change pending) |
| [DEF-02](#def-02) | Medium | SFR-06 (nerocladiaus) | APIs accept sessions past the 15-minute idle timeout | Open |
| [DEF-03](#def-03) | Medium | SFR-06 (nerocladiaus) | Session token still works after logout | Open |
| [DEF-04](#def-04) | Medium | SFR-06 (nerocladiaus) | No Origin check on state-changing API requests | Open |
| [DEF-05](#def-05) | Medium | SNFR-01 (unassigned), SFR-06 | Session cookies missing `Secure` and `SameSite` | Open |
| [DEF-06](#def-06) | Low | SNFR-01 (unassigned) | Session lifetime and idle timeout not documented | Open |
| [DEF-07](#def-07) | Low | SNFR-03 (unassigned) | `X-Powered-By: Next.js` header reveals the framework | Open |
| [DEF-08](#def-08) | Low | SNFR-03 (unassigned) | 26 API routes return 5xx errors without logging them | Open |

Severity: **High** = exploitable now with real impact; **Medium** = a security
control the requirement asks for is missing, but another layer limits the impact;
**Low** = hardening or operational gap.

---

### DEF-01

**UAT account password hardcoded in public test files** · Medium · Fixed (password change pending)

- **Found by:** code inspection during setup (not a test case).
- **What:** the shared UAT password is in `tests/test-server-authorization.mjs`
  (lines 9, 14) and `tests/test-workflow-regression.mjs` (lines 8, 13, 18). The
  repository is public, so anyone can sign in as these member and admin test
  accounts on any deployment that uses this database.
- **Suggested fix:** read it from `UAT_PASSWORD` in `.env.local`, as
  `tests/security/` does, and change the UAT accounts' password, since the current
  one is already in the git history.
- **Fix:** both files now read the password from `UAT_PASSWORD` and stop with a
  clear message if it is missing; the `test:sfr05:authz` and
  `test:sfr05:workflows` scripts load `.env.local`. TC-SFR-05 gained step 5, which
  fails if any committed file contains the UAT password (the same check run
  against the previous commit, `1df41d1`, finds both files). Confirmed by the
  owner (ooWise).
- **Retest evidence:** [`TC-SFR-05/`](evidence/runs/2026-10-29T15-28-54/TC-SFR-05/) (run 2026-10-29T15-28-54):
  15/15 pass, including step 5 (0 files contain the password) and all three SFR-05
  suites running with the password from `.env.local`.
- **Still open:** the old password remains in the repository's git history, so the
  UAT accounts' password should be changed. Not done here, because the accounts
  are shared by the team. Close this defect once it is changed and `UAT_PASSWORD`
  is updated in everyone's `.env.local`.

### DEF-02

**APIs accept sessions past the 15-minute idle timeout** · Medium · Open

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
- **Fix:** — · **Retest evidence:** —

### DEF-03

**Session token still works after logout** · Medium · Open

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
- **Fix:** — · **Retest evidence:** —

### DEF-04

**No Origin check on state-changing API requests** · Medium · Open

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
- **Fix:** — · **Retest evidence:** —

### DEF-05

**Session cookies missing `Secure` and `SameSite`** · Medium · Open

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
- **Fix:** — · **Retest evidence:** —

### DEF-06

**Session lifetime and idle timeout not documented** · Low · Open

- **Found by:** TC-SNFR-01 step 5 (inspection).
- **Evidence:** [`TC-SNFR-01/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-01/) checks 8–9.
  No Markdown file in the repository mentions the 7-day token lifetime or the
  15-minute idle timeout.
- **Suggested fix:** a short "Sessions" section in `docs/setup.md`: token lifetime
  (7 days, `lib/auth.ts`), idle timeout (15 minutes, `lib/session.ts`), cookie flags.
- **Fix:** — · **Retest evidence:** —

### DEF-07

**`X-Powered-By: Next.js` header reveals the framework** · Low · Open

- **Found by:** TC-SNFR-03 step 6.
- **Evidence:** [`TC-SNFR-03/`](evidence/runs/2026-10-29T13-16-06/TC-SNFR-03/) check 23.
  Sent on page responses and 404s (JSON API responses don't include it).
- **Suggested fix:** `poweredByHeader: false` in `next.config.ts`.
- **Fix:** — · **Retest evidence:** —

### DEF-08

**26 API routes return 5xx errors without logging them** · Low · Open

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
- **Fix:** — · **Retest evidence:** —
