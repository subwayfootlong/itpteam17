# Local Setup

## Prerequisites

1. Install [Node.js](https://nodejs.org/) using the current LTS version.
2. Make sure `npm` is available in your terminal after installation.

## Install Dependencies

From the project root, install the required npm packages:

```bash
npm install
```

This installs the packages in `package.json`, including `next`, `react`, and `react-dom`.

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
