-- Member notifications for benefits, announcements, and events.
-- Run this in Supabase SQL Editor after public.users exists.

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('Benefit', 'Announcement', 'Event', 'Renewal', 'System')),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  title text not null,
  message text not null,
  action_label text not null,
  action_href text not null,
  source_type text not null,
  source_id text not null,
  is_read boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists is_deleted boolean not null default false;

create unique index if not exists notifications_user_source_unique
  on public.notifications(user_id, source_type, source_id);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, is_deleted, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_deleted, is_read, created_at desc);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  benefit_enabled boolean not null default true,
  announcement_enabled boolean not null default true,
  event_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences"
  on public.notification_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
