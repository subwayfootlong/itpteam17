# Issue #64: transactional member email

## Setup and rollout

1. Apply `docs/supabase-transactional-email.sql`, then `docs/supabase-announcement-email.sql`, in Supabase SQL Editor as the database owner, after the existing users, events, event registrations, announcements and notification-preferences tables. Both scripts are transactional and rerunnable. The first adds one opt-in column, an outbox, a registration trigger and restricted worker functions. The second adds an opt-in-period timestamp and first-publication ledger/trigger/batch functions. Neither enables email or sends historical registrations/announcements.
2. Deploy the corresponding application code. Set `APP_URL` to the canonical HTTPS portal origin (required for email links). Reuse `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM` from the existing email-change setup. No new provider/library is needed.
3. Set `TRANSACTIONAL_EMAIL_WORKER_SECRET` to an independent random secret of at least 32 characters. Never prefix it with `NEXT_PUBLIC_`, commit it, or include it in URLs.
4. Configure a trusted scheduler to **POST** `/api/internal/transactional-emails` with `Authorization: Bearer <TRANSACTIONAL_EMAIL_WORKER_SECRET>`. For example, use a protected server-side scheduler or Supabase Cron HTTP request with the bearer secret stored in Vault. This repository does not configure a deployment-specific scheduler automatically. The existing email-change notification endpoint is separate and still needs its existing schedule.
5. Each invocation processes either one recipient-expansion page (at most 100 members) or, when no expansion is ready, one delivery. Schedule regularly and invoke additional bounded workers to drain a backlog; do not expose a browser control for this. Expect multiple invocations for a publication and for its messages. The handler declares a 60-second runtime budget. Ensure the hosting plan supports it. SMTP has a 15-second hard deadline plus existing connection/socket timeouts; queue/lookup requests have five-second timeouts. The five-minute job lease exceeds the handler budget.
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

## Announcement trigger and delivery

`queue_announcement_publication` records the first transition into `published` in the same transaction as the announcement write. Creating a published announcement and publishing a draft both trigger it. Drafts, archives and normal edits do not. The ledger's primary key is the announcement ID, so archive/republish cannot create a second campaign. No change to the Admin Announcement UI or either publishing API is required. Their existing in-app notifications, including notifications after audience edits, continue unchanged.

The migration seeds existing published/archived announcements as completed to avoid a deployment email blast. Existing drafts can still be published. Publication history before this migration cannot be reconstructed for old records that have already been returned to draft; review such legacy drafts before publishing them after rollout.

The protected worker claims a publication using a five-minute lease, then scans member IDs in stable pages of at most 100. New accounts created after publication and opt-ins begun after publication are excluded. The current opt-in period is tracked independently of unrelated in-app preference edits. Opting out and back in does not resurrect a past announcement campaign.

Recipient selection uses the existing membership/tier helpers against **both the original publication audience and the current audience**. An edit cannot widen an email campaign; a narrower current audience is respected. Only current members with active/eligible membership and consent are queued. Recipient IDs are deduplicated with a unique announcement/member key. IDs and the cursor are committed together in one restricted function, so a crash before commit can safely replay the page. The worker resolves each current account email only at delivery and repeats consent, original/current audience, account-role, expiry and published-status checks. A publication archived before expansion is marked complete without recipients; queued messages for an archived/deleted announcement are skipped.

Each recipient receives a separate email with a greeting, title, short text summary, link to the Member Portal announcements tab, official footer and settings link. No recipient list or full stored email body is used. Pending messages use current announcement content; editing it does not enqueue more messages. The title and summary are safely HTML-escaped using the shared template.

If recipient expansion fails, its cursor is not advanced and the lease allows recovery after five minutes. Expansion is retried until it succeeds (not capped like individual SMTP deliveries); monitor long-running publications. A stream of large publications can delay deliveries while expansion pages are processed, so scheduler frequency/concurrency should match traffic. Individual delivery attempts remain capped at five.

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

`node --test tests/transactionalEmail.test.mjs tests/announcementEmail.test.mjs` uses the installed PGlite PostgreSQL engine to execute the actual migrations, triggers, claim/retry functions and route handlers through a small test PostgREST adapter. SMTP is mocked: tests never send real mail. It covers success/duplicate/failure/reactivation, cancellation, external redirect, member access, preferences/ownership/defaults, rollback, leases, retry cap, restricted database access, delivery rechecks, templates and SMTP failure sanitisation. Announcement tests additionally cover actual admin creation/update routes, first publication, edit/archive/republish, preserved in-app audience notifications, eligibility/consent, batched fanout, crash recovery and rollout without historical sends.

Also run `npx tsc --noEmit` and `npm run build`. Manual staging checks remain necessary for deployed Supabase schema/RLS roles, scheduler authorisation/cadence, SMTP/TLS/acceptance, inbox rendering/mobile layout, account email changes and real concurrent worker behaviour. PGlite serialises local test queries and is not a live multi-connection concurrency test. Existing capacity semantics and any pre-existing RSVP race behaviour are outside this email change.

Validation completed locally on 28 October 2026:

| Stage | Focused tests | TypeScript | Production build |
| --- | --- | --- | --- |
| Commit 1: RSVP/preferences | 9 passed | `npx tsc --noEmit` passed | `npm run build` passed |
| Commit 2: combined RSVP/announcement implementation | 16 passed, including SMTP hard-timeout behaviour | `npx tsc --noEmit` passed | `npm run build` passed (49 static pages) |

`git diff --check` also passed. Lint was not run. No live Supabase migration, SMTP send, deployment or scheduler configuration was performed by these tests.

## Changed files

| Files | Purpose |
| --- | --- |
| `lib/email.ts` | Reuse existing SMTP settings; optional HTML, a hard send deadline and one structured recipient mailbox. Existing OTP callers remain compatible. |
| `lib/notifications.ts`, `app/api/member/notification-preferences/route.ts` | Persist/read/validate the separate email opt-in through the existing preference API. |
| `components/member/MemberSettingsView.tsx` | Wire the existing Email Notifications switch to server preferences, with save/error state. No App Theme changes or redesign. |
| `.env.local.example` | Document the dedicated worker secret; no real credentials. |
| `lib/transactionalEmail.ts` | Shared protected-worker authorisation, delivery, eligibility checks, leases/retries and announcement recipient expansion. |
| `lib/transactionalEmailTemplates.ts` | Shared escaped, responsive Pergas HTML/plain-text templates for RSVP and announcements. |
| `app/api/internal/transactional-emails/route.ts` | Protected scheduled POST worker, processing a bounded phase per request. |
| `docs/supabase-transactional-email.sql` | Email opt-in, durable outbox, registration trigger and worker RPCs. |
| `docs/supabase-announcement-email.sql` | Consent timestamp, first-publication ledger, publication trigger and atomic batch RPCs. |
| `tests/helpers/emailHarness.mjs` | Local PostgreSQL fixtures, PostgREST adapter and actual TypeScript module loader. |
| `tests/transactionalEmail.test.mjs`, `tests/announcementEmail.test.mjs` | Focused route/database/delivery/security tests, with mocked SMTP. |
| `docs/transactional-email.md` | This setup, policy, reliability and validation guide. |

The RSVP route and both announcement publishing routes were inspected and tested, but do not need code changes: database triggers capture only successful writes. No changes were made to SNFR-02 response contracts, membership QR security, JWT architecture, the Admin Announcement UI or unrelated database schemas.
