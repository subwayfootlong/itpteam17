-- Membership tier upgrade requests.
-- Safe for existing Beta 1 users: only missing tiers are backfilled to Basic.

create extension if not exists pgcrypto;

update public.users
set membership_tier = 'basic'
where membership_tier is null;

alter table public.users
  alter column membership_tier set default 'basic';

alter table public.users
  alter column membership_tier set not null;

alter table public.users
  drop constraint if exists users_membership_tier_check;

alter table public.users
  add constraint users_membership_tier_check
  check (membership_tier in ('basic', 'student', 'associate', 'ordinary'));

create table if not exists public.tier_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  current_tier text not null,
  requested_tier text not null,
  reason text,
  status text not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tier_upgrade_requests_current_tier_check
    check (current_tier in ('basic', 'student', 'associate', 'ordinary')),
  constraint tier_upgrade_requests_requested_tier_check
    check (requested_tier in ('basic', 'student', 'associate', 'ordinary')),
  constraint tier_upgrade_requests_status_check
    check (status in ('pending', 'approved', 'rejected')),
  constraint tier_upgrade_requests_different_tier_check
    check (current_tier <> requested_tier)
);

create unique index if not exists tier_upgrade_requests_one_pending_per_user_idx
  on public.tier_upgrade_requests (user_id)
  where status = 'pending';

create index if not exists tier_upgrade_requests_status_created_idx
  on public.tier_upgrade_requests (status, created_at desc);

create index if not exists tier_upgrade_requests_user_created_idx
  on public.tier_upgrade_requests (user_id, created_at desc);

alter table public.tier_upgrade_requests enable row level security;

-- Application access uses the server-side Supabase service role. These policies
-- also keep the table safe if a browser Supabase client is introduced later.
drop policy if exists "Members can read own tier requests" on public.tier_upgrade_requests;
create policy "Members can read own tier requests"
  on public.tier_upgrade_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Members can create own tier requests" on public.tier_upgrade_requests;
create policy "Members can create own tier requests"
  on public.tier_upgrade_requests
  for insert
  with check (auth.uid() = user_id and status = 'pending');
