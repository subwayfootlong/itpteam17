# Main merge security review — 2026-11-06

## History and starting state

- Feature tip: `f8a4cc5a3cb4740c3edf3bacc3ea377ed2e19efa`.
- Fetched main tip: `d5724db20545bc05ec939c8dc9944adbb4987926`.
- Merge base: `dd1b27f1c94107e5439b157eafe2c7194e607cce`.
- The initial working tree was **not clean**: this exact merge was already in
  progress, with eight unmerged files and main's other changes staged. Continued
  that merge without aborting, resetting, or discarding staged changes. Fetch
  confirmed its MERGE_HEAD equals the latest origin/main.
- Feature changes include case-insensitive email (`d782941`), SNFR-03 (`d355741`)
  and database sessions (`f8a4cc5`). Main includes SFR-05 RLS and `29f5b43`'s
  cookie expiry/CSRF changes. These independently edited the same auth paths.

## Actual conflicts and resolutions

| File | Root cause | Resolution |
| --- | --- | --- |
| `app/api/auth/activity/route.ts` | Feature centralized database validation and generic errors; main added cookie inactivity checks. | Use getCurrentUser's database validation for both roles; retain generic errors, cookie clearing on denial, and activity cookie refresh as a hint. |
| `app/api/auth/login/route.ts` | Database session creation and email matching overlapped main's centralized cookie setter. | Keep createSession, case-insensitive matching, input validation and sanitized logging; issue cookies via setSessionCookies. |
| `app/api/auth/register/route.ts` | Same cookie/session overlap as login. | Keep normalized email, duplicate handling, validation and database session creation; use shared secure cookie setter. |
| `app/api/events/rsvp/route.ts` | Feature wrapped GET in sanitized error handling while main removed GET analytics writes. | Retain authorization, tier/status validation and error handling; remove the analytics mutation from GET. POST analytics and main's client analytics POST remain. |
| `app/api/member/qr-token/route.ts` | Shared database member guard overlapped inline JWT/cookie authentication. | Use requireMember for database session and current-role checks; retain generic errors and QR response headers/format. |
| `lib/emailChangeServer.ts` | Shared database authentication overlapped inline JWT/cookie checks. | Use getCurrentUser, retain current-email/member-role checks, password verification, origin/content-type checks and sanitized logging. |
| `lib/session.ts` | Feature cookie constants overlapped main's sessionPolicy extraction and cookie helpers. | Consolidate on sessionPolicy and shared setters/clearers, preserving HTTP-only, production Secure, SameSite=Lax, high priority and seven-day max age. Database inactivity remains 15 minutes. |
| `proxy.ts` | Feature asynchronous database page checks overlapped main's API origin checks and cookie page checks. | Run main's origin check for API requests, preserving both bearer-worker exclusions and API matcher. APIs retain their route guards. Protected pages await database session validation and fail closed with sanitized logging and cleared cookies. |

## Automatically merged files reviewed

- Corrected `lib/currentUser.ts`: the automatic merge combined database validation
  with stale-cookie rejection. Database activity remains authoritative, preventing
  browser timestamps from controlling authorization. Preserved main's session
  cookie constant and cookie clearing on unauthorized responses, plus current DB
  role checks and feature logging.
- `components/SessionTimeout.tsx` imports client-safe policy constants.
- `components/member/EventRsvpSection.tsx` preserves main's direct external link
  and separate origin-protected analytics POST. No additional UI changes made.
- `docs/setup.md`, `lib/supabaseServer.ts`, `lib/requestSecurity.ts`,
  `lib/sessionPolicy.ts`, both SFR-05 SQL files, package scripts and four existing
  test files were reviewed. Main's SQL, request security, policy, package.json
  and tests are byte-equivalent after newline normalization to origin/main.
- Session SQL, sessionServer, serverErrors, generic error boundaries, emailIdentity,
  logout and password-change routes are unchanged from the feature tip.
- Internal worker routes still enforce their own bearer authorization.

## Security controls preserved

Feature: SNFR-03 generic unexpected responses and sanitized server logs; generic
Next.js error boundaries; database sessions with seven-day absolute expiry,
15-minute database-clock inactivity, logout revocation and password/email-change
trigger invalidation; case-insensitive login/registration; session SQL migration.

Main: SFR-05 RLS migrations/access restrictions, server-client guard, API CSRF
origin checks, shared secure cookies, existing authorization/input checks, read-only
RSVP GET behavior, all existing security tests and npm scripts.

## Verification

- `npx tsc --noEmit`: passed.
- `npm run build`: passed; production compilation, TypeScript and all 49 static
  pages completed successfully.
- `npm run test:security`: 5 passed, 0 failed.
- `node --test tests/merge-session-security.test.cjs`: 4 passed, 0 failed.
  Uses actual transpiled proxy/cookie/origin code with explicit mocks and in-memory
  PGlite. Exercises origin rejection, valid/revoked/error page sessions, cookie
  clearing, database idle expiry, logout isolation, password/email invalidation,
  stale-password login rejection and session table/function grants.
- PGlite also executes the unchanged SFR-05 migration, session migration, then
  SFR-05 again against a minimal dependency schema. Checks anonymous visibility,
  member row isolation, forbidden password reads/role escalation, permitted own
  profile updates, blocked self-approved comments, server-only table restrictions,
  admin visibility and session restrictions after both migrations.
- `git diff --check`: passed for resolutions. The final staged check reports
  pre-existing whitespace in main's two RLS files, requestSecurity, sessionPolicy
  and security-controls test; these files were preserved unchanged. No unmerged
  paths remain. Preservation comparisons described above passed.
- `npm run test:qr` and `npm run test:email`: could not execute because
  `tests/membershipQr.test.mjs` and `tests/emailChange.test.mjs` are absent from
  both branch tips. Existing scripts were preserved; these are pre-existing gaps.
- `test:sfr05:rls`, `test:sfr05:authz`, `test:sfr05:workflows` and their aggregate
  were not run: they require Supabase and perform writes (including session
  creation during login, fixture updates/inserts and cleanup). No isolated
  Supabase environment is available. Per user instruction, no live DB tests ran.
- No lint, live migration, credential/configuration change, push or PR.

## Remaining risks and deployment requirements

Live Supabase/PostgREST integration testing remains pending. The local fixture is
not a full production schema or concurrent multi-connection test. It does not
validate deployed grants, real credentials, browser workflows or worker delivery.
The absent QR/email suites remain unavailable. The user authorized committing
after available safe checks, with these limitations explicitly documented.

Apply the session migration through the approved deployment process before
deploying this code; existing JWTs without session IDs will require login again.
Preserve the SFR-05 migration as well. Database availability is required for
authentication, and page validation adds database work. In-flight authorized
requests cannot be recalled by later revocation. Registration and session creation
remain separate operations, so a failed session creation may require retrying login.
