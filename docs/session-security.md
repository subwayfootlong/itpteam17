# Session security deployment and verification

## Deployment order

1. Keep the existing users schema and previous feature migrations, including
   `supabase-email-change-migration.sql`, in place. This migration only requires
   `public.users` with UUID `id`, `email`, `password_hash`, and `role` columns and
   the standard Supabase `anon`, `authenticated`, and `service_role` roles.
2. Apply `docs/supabase-session-security-migration.sql` once through the approved
   Supabase SQL migration process, **before** deploying this application. Its
   transaction creates the session table, indexes, credential-change trigger,
   and service-role-only functions, then reloads the PostgREST schema cache.
   Do not run it twice; all changes roll back if the transaction fails.
3. Deploy all application instances together (or pause authentication during the
   rollout). Old instances do not enforce session revocation. Existing JWTs have
   no session ID and are intentionally rejected; everyone must log in again.
4. Keep the service role key server-side and serve production over HTTPS. Existing
   `JWT_SECRET` is reused; no new secrets or dependencies are required.
5. Smoke-test member/admin login, inactivity, password change and logout in staging.
   Confirm the deployment's database roles retain the restricted table/function
   grants. No live Supabase migration was applied during implementation.

Expired rows may periodically be removed by a trusted database maintenance job:
`delete from public.auth_sessions where expires_at <= clock_timestamp();`
Cleanup is optional for correctness; expired rows can never authenticate.

## Behavior and root causes

- Previously, an unsigned `last_activity` cookie controlled inactivity checks.
  Missing/future timestamps bypassed them, and several API handlers only verified
  the JWT. JWTs now carry a random session ID. The central server helper checks
  the signature, seven-day absolute expiry, and a matching database session.
  Database time determines activity; 15 minutes of inactivity, future stored
  activity, or absolute expiry rejects and removes the session. Only a valid
  session with a matching current email can advance activity. Browser activity
  cookies are compatibility hints and are never read for authorization.
- Previously, password updates did not affect issued JWTs. A database trigger now
  deletes all sessions when the password hash changes, within the password-update
  transaction. A failed/rolled-back update cannot revoke sessions. The password
  route revalidates the current session and compares the previously checked hash
  under a user-row lock before updating. Bcrypt and existing validation remain.
  Successful changes clear cookies and send the user back to login. There is no
  password-reset workflow in this checkout; the trigger also covers future resets
  and direct password updates. Email changes also revoke sessions, in addition to
  the existing stale-email checks and verification workflow.
- Previously, logout only cleared cookies. It now deletes the current session,
  leaving other sessions intact, before clearing both cookies. Missing, invalid,
  expired and already-revoked tokens can be logged out repeatedly. On a database
  failure logout returns a generic 500 and retains cookies so revocation can be
  retried; it does not falsely report success.

All session operations lock the user row before accessing session rows. Login
rechecks the password hash and email under that lock, so a password verified before
a concurrent credential change cannot create a session afterward. Validation,
revocation and password changes serialize at that lock. A request authorized before
revocation may already be executing; revocation cannot cancel in-flight application
work. Subsequent validation rejects the token. No raw JWTs or password hashes are
stored in the sessions table, and public database roles cannot access it or invoke
session functions.

Existing member/admin API guards and server-rendered user lookups use the shared
validator. Proxy additionally validates protected page navigations because Next.js
can reuse layouts. This adds database work to page navigation, but authorization
does not rely solely on Proxy or client timers. Current database role and membership
status lookups remain intact. The independent five-minute QR signing/verification
format is unchanged; obtaining a QR now uses the same member session guard.
Cookies remain HTTP-only and use SameSite=Lax, with Secure enabled in production.
Unexpected failures fail closed and use the existing sanitized SNFR-03 logger.

## Verification (2026-11-02)

- `npx tsc --noEmit`: passed.
- `npm run build`: passed, including production TypeScript and page generation.
- `npm run test:qr` and `npm run test:email`: attempted; both reference files in a
  `tests` directory absent from this checkout, so neither suite could run.
- Temporary local tests executed the real SQL migrations in PGlite and transpiled
  application helpers/handlers with a local database adapter and mocked cookies.
  They checked the 15-minute boundary, timestamp tampering, page redirects and
  member/admin API denial, role enforcement, logout isolation/idempotence/replay,
  failed password-update rollback, successful password change and new login,
  stale login credentials, direct reset invalidation, the existing email-change
  SQL workflow, JWT/DB absolute expiry, signature/identity mismatch, unchanged
  five-minute QR behavior, database privileges, and sanitized failure handling.
- Sixteen security/regression groups passed. SQL error injection after the password
  trigger proved transaction rollback restores both credentials and sessions.
  Session database failures denied authentication and did not leak injected secrets.
- Temporary test file `session-security.temporary.cjs` was removed after testing;
  no existing tests or test directories were deleted. Lint was not run.

PGlite exercises real PostgreSQL transactions but does not simulate separate
production connections contending for locks. Lock ordering and both stale-credential
operation orders were reviewed/tested locally; live multi-connection load and browser
end-to-end testing remain staging checks. Database availability is now required for
authentication. A stolen valid token can still make requests until idle/absolute
expiry or revocation, as with other bearer sessions. Registration account creation
and session creation remain separate operations: if session creation fails after
registration, the account exists and the user can retry login.

## File inventory

Created: `lib/sessionServer.ts`, `docs/supabase-session-security-migration.sql`,
`docs/session-security.md`.

Modified: `lib/auth.ts`, `lib/session.ts`, `lib/currentUser.ts`,
`lib/emailChangeServer.ts`, `proxy.ts`, `app/api/auth/login/route.ts`,
`app/api/auth/register/route.ts`, `app/api/auth/activity/route.ts`,
`app/api/auth/logout/route.ts`, `app/api/member/change-password/route.ts`,
`app/api/member/qr-token/route.ts`, `components/member/ChangePasswordForm.tsx`.
