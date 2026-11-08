-- SFR-06 / DEF-03: server-side logout, one session at a time.
--
-- Every sign-in token (JWT) has its own session ID (`jti`). Logging out adds
-- "<jti>:<expiry>" to the member's revoked_sessions, so that token is rejected by
-- getCurrentUser(), the QR endpoint and email change, while the member's other
-- devices stay signed in. Entries are removed once the token would have expired
-- (at most 7 days), so the list stays short. Tokens issued before this change have
-- no session ID and simply expire; nobody is signed out when this is applied.
--
-- Run in the Supabase SQL editor BEFORE deploying the code that reads it. Safe to re-run.
-- Not exposed through the Data API: the SFR-05 column grants on public.users do not
-- include it (docs/supabase-sfr05-rls.sql), and only the server (service role) uses it.

alter table public.users
  add column if not exists revoked_sessions text[] not null default '{}';
