# Issue #64: transactional member email

## Setup and rollout

1. Apply `docs/supabase-transactional-email.sql` in Supabase SQL Editor as the database owner, after the existing users, events, event registrations and notification-preferences tables. The script is transactional and rerunnable. It adds one opt-in column, an outbox, a registration trigger and restricted worker functions. It does not backfill old registrations or enable email for existing members.
2. Deploy the corresponding application code. Set `APP_URL` to the canonical HTTPS portal origin (required for email links). Reuse `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` from the existing email-change setup. No new provider/library is needed.
3. Set `TRANSACTIONAL_EMAIL_WORKER_SECRET` to an independent random secret of at least 32 characters. Never prefix it with `NEXT_PUBLIC_`, commit it, or include it in URLs.
4. Configure a trusted scheduler to **POST** `/api/internal/transactional-emails` with `Authorization: Bearer <TRANSACTIONAL_EMAIL_WORKER_SECRET>`. For example, use a protected server-side scheduler or Supabase Cron HTTP request with the bearer secret stored in Vault. This repository does not configure a deployment-specific scheduler automatically. The existing email-change notification endpoint is separate and still needs its existing schedule.
5. Each invocation claims at most one delivery. Schedule regularly and invoke additional bounded workers to drain a backlog; do not expose a browser control for this. The handler declares a 60-second runtime budget. Ensure the hosting plan supports it. SMTP has a 15-second hard deadline plus existing connection/socket timeouts; queue/lookup requests have five-second timeouts. The five-minute job lease exceeds the handler budget.
6. Test against a staging SMTP mailbox before enabling the schedule in production. Opt in explicitly in Member Settings, register for a future internal event, invoke the worker, and verify the multipart email and its portal/settings links.

If the migration is absent, email preference saves and the worker fail; do not deploy this code without the migration. SQL queue insert failures fail the registration transaction rather than silently lose a promised job. SMTP is never called in that transaction or in the RSVP HTTP response. SMTP failure cannot undo a saved registration.

## Consent and notification policy

The existing **Email Notifications** switch is now a persistent, account-scoped server preference (`notification_preferences.email_enabled`). It defaults to **false**, including for existing users and missing preference rows. Enabling it explicitly opts into both RSVP confirmations and announcement emails; disabling it stops both. There is one existing switch, not a second set of duplicate category controls. Its description states this scope. This feature does not introduce optional event-publication broadcasts.

An RSVP confirmation is transactional, but this implementation still honours the member's expressed email preference: no confirmation is queued while email is off. The portal's registration acknowledgement remains available regardless. Switching on does not backfill registrations. Switching off suppresses pending deliveries when the worker next checks the preference. As with any email system, an opt-out/cancellation racing an SMTP send already in progress cannot recall that message.

The existing benefit/announcement/event preferences retain their **in-app** meaning and defaults. The push cookie remains a separate device-level control. Neither an in-app preference nor the push cookie supplies email consent. Password changes, email-change OTPs and other security email flows are unaffected by this optional-email switch.

## RSVP trigger and delivery

`queue_rsvp_email` runs after a registration insert or status transition to `registered`, in the same database transaction. It verifies the account is a member, email opt-in is true, and the event is published and internal. A unique key combines registration ID and registration occurrence time. Repeated writes to an already-registered row queue nothing; a rejected registration reactivated with a new `registered_at` gets a new confirmation. Deleting/cancelling a registration queues nothing. External redirect clicks never write registrations, and even a direct insert against an external event is excluded from email.

The existing RSVP route, authorisation, tier checks, capacity bookkeeping and cancellation logic are unchanged. The worker additionally checks current member role, membership eligibility using `evaluateTierAccess`/`normalizeTierAudience`, current email consent, the registration's active status and occurrence, and the event's current publication/audience/internal status. It resolves the recipient from the current account record, never from request input or a stored address in the outbox. Cancelled, superseded, missing or ineligible sources are marked skipped.

The responsive Pergas template has HTML-escaped text, a plain-text alternative, member greeting, event title/date/time/venue and a reminder to open the portal for a current membership QR. It never generates, embeds or stores a QR token. Links use configured `APP_URL`, not a caller-controlled host.

## Delivery guarantees, privacy and operations

- The outbox stores IDs, an occurrence timestamp, a unique key, delivery state, attempt count, lease timestamps and fixed error codes. It stores no full email body, recipient email address, password, SMTP response or QR token.
- Worker SQL functions are executable only by `service_role`; outbox tables have RLS enabled and no public/member access. The HTTP worker requires the dedicated bearer secret and returns only a result/error, never a recipient list.
- `FOR UPDATE SKIP LOCKED` provides exclusive claims. Each attempt has a random lease token; completion is conditional on that token and an unexpired lease. Stale workers cannot finish a newer worker's job.
- SMTP failures retry with exponential backoff, up to five attempts. A crash leaves the lease recoverable after five minutes. Exhausted jobs are marked failed, including abandoned fifth attempts.
- One email has one recipient. The existing Nodemailer transport is reused with a stable Message-ID per outbox job, plain text and optional HTML. OTP callers keep their existing signature/behaviour.
- **SMTP delivery is not exactly-once.** A crash after SMTP acceptance but before the database records success, or an ambiguous SMTP timeout, can cause a duplicate on retry. Stable Message-ID may help downstream systems but is not a deduplication guarantee. No automatic blind resend of completed jobs is implemented.
- Monitor counts of pending/processing/failed jobs and oldest pending time through a trusted database/admin channel. `last_error` is deliberately generic (`delivery_failed`/`lease_expired`). Diagnose SMTP configuration with staging/provider tools rather than logging recipients or credentials in application logs.
- Retain deduplication rows while their source may be replayed. Do not simply delete recent sent/failed/skipped rows to retry. Establish a deployment retention policy; identifiers are still personal data even without addresses/bodies.

## Validation

`node --test tests/transactionalEmail.test.mjs` uses the installed PGlite PostgreSQL engine to execute the actual migration, triggers, claim/retry functions and route handlers through a small test PostgREST adapter. SMTP is mocked: tests never send real mail. It covers success/duplicate/failure/reactivation, cancellation, external redirect, member access, preferences/ownership/defaults, rollback, leases, retry cap, restricted database access, delivery rechecks, templates and SMTP failure sanitisation.

Also run `npx tsc --noEmit` and `npm run build`. Manual staging checks remain necessary for deployed Supabase schema/RLS roles, scheduler authorisation/cadence, SMTP/TLS/acceptance, inbox rendering/mobile layout, account email changes and real concurrent worker behaviour. PGlite serialises local test queries and is not a live multi-connection concurrency test. Existing capacity semantics and any pre-existing RSVP race behaviour are outside this email change.
