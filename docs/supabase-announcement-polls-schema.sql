-- Attendance poll support for admin-managed announcements.
-- Run manually in the Supabase SQL editor.

alter table public.announcements
  add column if not exists poll_enabled boolean not null default false,
  add column if not exists poll_question text;

create table if not exists public.announcement_poll_responses (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  response text not null check (response in ('yes', 'no', 'maybe')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (announcement_id, user_id)
);

create index if not exists announcement_poll_responses_announcement_id_idx
  on public.announcement_poll_responses (announcement_id);
