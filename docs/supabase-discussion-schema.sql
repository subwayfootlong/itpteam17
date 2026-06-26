-- Community discussion schema
-- Run this in Supabase SQL Editor after public.users exists.
-- The main post table is public.discussion, as requested.

create extension if not exists pgcrypto;

create table if not exists public.discussion_groups (
  id text primary key,
  title text not null,
  icon text not null default 'message',
  tone text not null default 'green' check (tone in ('green', 'gold')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.discussion (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.discussion_groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text,
  title text not null,
  body text not null,
  votes integer not null default 0,
  has_image boolean not null default false,
  status text not null default 'pending' check (status in ('approved', 'pending', 'flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text,
  author_role text not null default 'Active Member',
  body text not null,
  status text not null default 'pending' check (status in ('approved', 'pending', 'flagged')),
  created_at timestamptz not null default now()
);

create index if not exists discussion_groups_sort_idx
  on public.discussion_groups(sort_order);

create index if not exists discussion_group_created_idx
  on public.discussion(group_id, created_at desc);

create index if not exists discussion_status_created_idx
  on public.discussion(status, created_at desc);

create index if not exists discussion_comments_thread_idx
  on public.discussion_comments(thread_id, created_at);

insert into public.discussion_groups (id, title, icon, tone, sort_order)
values
  ('general', 'General Discussion', 'message', 'green', 1),
  ('spiritual', 'Spiritual Reflections', 'spark', 'gold', 2)
on conflict (id) do update
set
  title = excluded.title,
  icon = excluded.icon,
  tone = excluded.tone,
  sort_order = excluded.sort_order;
