# Local Setup

## Prerequisites

1. Install [Node.js](https://nodejs.org/) using the current LTS version.
2. Make sure `npm` is available in your terminal after installation.

## Install Dependencies

From the project root, install the npm packages listed in `package.json`:

```bash
npm install
```

This installs all project dependencies and dev dependencies from `package.json`, including `next`, `react`, `react-dom`, and the TypeScript typings.

You still need to set up these manually:

- `.env.local` with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`
- the Supabase `users` table in your database
- any files in `public/` such as the logos used by the UI

## Email delivery for development/demo

Before requesting OTPs, run the complete
[`supabase-email-change-migration.sql`](./supabase-email-change-migration.sql)
in your Supabase project's SQL editor. It installs the tables **and** the
`email_change_throttle`, `email_change_start`, and `email_change_finish` functions.
The script can be rerun without deleting existing rows and refreshes the API
schema cache. Creating just the tables is insufficient: missing functions produce
`PGRST202` and a 503 response. The server terminal records the function name and
error code without exposing passwords, OTPs or database records.

Set `APP_URL` to the browser's exact origin (scheme, hostname and port), without
the page path. For `http://localhost:3000/member/settings/email`, use
`APP_URL=http://localhost:3000` in `.env.local`. Restart the dev server after
changing it. OTP requests validate this origin; `localhost`, `127.0.0.1` and a
network IP are different origins. In deployment, use the public application origin.

SMTP through Nodemailer is used temporarily for ITP2 development/demo. Configure
these server-side variables in `.env.local` or the deployment environment:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=itpteam17@gmail.com
SMTP_PASSWORD=
EMAIL_FROM=itpteam17@gmail.com
```

Use the team-controlled mailbox `itpteam17@gmail.com` as `SMTP_USER`
and an authorized sender address as `EMAIL_FROM`. Port 587 requires STARTTLS;
port 465 uses TLS from connection start. Certificate validation remains enabled.
Never commit real SMTP credentials or mailbox passwords to Git. They must remain
only in `.env.local` or deployment environment variables, never `NEXT_PUBLIC_*`.
`lib/email.ts` has a `server-only` import guard to prevent client-side imports.

**Gmail setup:** Sign in to the team Google account, enable 2-Step Verification,
then create an [app password](https://myaccount.google.com/apppasswords) for this
application. Put the generated 16-character app password (without display spaces)
in `SMTP_PASSWORD` in `.env.local` or deployment environment variables. Do not use
the regular Google account password or paste the app password into chat or Git.
Restart the development server after updating the environment. If app passwords
are unavailable due to account security settings or policy, OAuth2 is required
instead; this transport currently uses app-password authentication.
See [Google's app-password instructions](https://support.google.com/accounts/answer/185833)
and [Gmail SMTP settings](https://support.google.com/a/answer/176600).

Keep existing `EMAIL_CHANGE_SECRET` and `EMAIL_NOTIFICATION_CRON_SECRET` values
unchanged. Both OTP messages and old-email security notifications use this SMTP
transport. The email-change flow, expiry, resend limits and durable notification
retry logic are unchanged. Continue scheduling authenticated POST requests to
`/api/internal/email-change-notifications` using the existing cron secret.
An SMTP error is reported as delivery failure so the existing cancellation/retry
logic still applies. SMTP has no Resend-style idempotency guarantee: a retry
after an ambiguous delivery failure can deliver a duplicate message, even though
the same Message-ID is reused. Check inbox delivery using team-owned test accounts.

Production should use Pergas-provided email credentials or a verified transactional
email provider. The original Resend implementation is preserved as a clearly
marked comment in `lib/email.ts`, and `EMAIL_API_KEY` remains a commented option
in `.env.local.example`. To restore it, replace the active SMTP function with the
preserved Resend function and configure the production key and verified sender.

Validation commands: `npm run test:email`, `node --test tests/emailSmtp.test.mjs`,
`npx tsc --noEmit`, `npm run lint`, and `npm run build`.

## Start the Web App

Run the development server:

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Other Useful Commands

```bash
npm run build
npm start
npm run lint
```

## Integrating Supabase for custom auth (optional)

This project can use Supabase as a Postgres database while implementing a custom email/password auth (the app treats email as a username). Key steps:

1. Create a Supabase project at https://app.supabase.com and copy the project URL and **service role key**.
2. Add these variables to `.env.local` (or use the example `.env.local.example`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=replace_with_a_strong_random_value
```

3. Create a `users` table in your Supabase database. Example SQL (run in SQL editor):

```sql
create table users (
	id uuid primary key default gen_random_uuid(),
	full_name text,
	email text unique not null,
	password_hash text not null,
	created_at timestamptz default now()
);
```

4. The repo includes server API routes at `app/api/auth/register` and `app/api/auth/login` that:
- insert and read rows from `users` using the service role key
- save `full_name`, `email`, and `password_hash` into `users`
- hash passwords with `bcryptjs`
- issue a signed JWT stored in an HTTP-only cookie

5. Start the dev server and test login/register via the UI.

Notes:
- The implementation uses a custom auth flow backed by Supabase Postgres. It does not use Supabase Auth/magic links.
- Keep the service role key secret and use server-side code only.
- If you change dependencies in `package.json`, run `npm install` again to update `node_modules` and `package-lock.json`.
