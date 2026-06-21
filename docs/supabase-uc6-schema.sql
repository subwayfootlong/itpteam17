-- UC6: View Announcements & Engage
-- Run this in the Supabase SQL editor after your existing users table exists.
-- If your users.id column is not uuid, change the user_id columns below to match it.

create extension if not exists pgcrypto;

create table if not exists public.uc6_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Official', 'Events', 'Membership', 'Community')),
  summary text not null,
  body text not null,
  published_at timestamptz not null default now(),
  read_time text not null default '2 min read',
  pinned boolean not null default false,
  comments_enabled boolean not null default true,
  status text not null default 'published' check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.uc6_announcement_comments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.uc6_announcements(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text,
  author_role text not null default 'Active Member',
  body text not null,
  status text not null default 'pending' check (status in ('approved', 'pending', 'flagged')),
  created_at timestamptz not null default now()
);

create table if not exists public.uc6_discussion_groups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon text not null default 'message',
  tone text not null default 'green' check (tone in ('green', 'gold')),
  sort_order integer not null default 0
);

create table if not exists public.uc6_discussion_threads (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.uc6_discussion_groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text,
  title text not null,
  body text not null,
  votes integer not null default 0,
  has_image boolean not null default false,
  status text not null default 'pending' check (status in ('approved', 'pending', 'flagged')),
  created_at timestamptz not null default now()
);

create table if not exists public.uc6_thread_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.uc6_discussion_threads(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  author_name text,
  author_role text not null default 'Active Member',
  body text not null,
  status text not null default 'pending' check (status in ('approved', 'pending', 'flagged')),
  created_at timestamptz not null default now()
);

create index if not exists uc6_announcements_status_published_idx
  on public.uc6_announcements(status, pinned desc, published_at desc);

create index if not exists uc6_announcement_comments_announcement_idx
  on public.uc6_announcement_comments(announcement_id, created_at);

create index if not exists uc6_discussion_groups_sort_idx
  on public.uc6_discussion_groups(sort_order);

create index if not exists uc6_discussion_threads_group_idx
  on public.uc6_discussion_threads(group_id, created_at desc);

create index if not exists uc6_thread_comments_thread_idx
  on public.uc6_thread_comments(thread_id, created_at);

insert into public.uc6_discussion_groups (id, title, icon, tone, sort_order)
values
  ('00000000-0000-0000-0000-000000000601', 'General Community', 'message', 'green', 1),
  ('00000000-0000-0000-0000-000000000602', 'Spiritual Reflections', 'spark', 'gold', 2)
on conflict (id) do nothing;

insert into public.uc6_announcements (
  id,
  title,
  category,
  summary,
  body,
  published_at,
  read_time,
  pinned,
  comments_enabled,
  status
)
values
  (
    '00000000-0000-0000-0000-000000000611',
    'Membership renewal reminder for active members',
    'Membership',
    'Members are encouraged to check their renewal status before upcoming programmes and benefit redemptions.',
    'Please review your membership status and renewal date in your profile before registering for members-only programmes or redeeming Friends of Pergas benefits. This helps ensure that your digital card remains valid for verification.',
    now() - interval '2 hours',
    '2 min read',
    true,
    true,
    'published'
  ),
  (
    '00000000-0000-0000-0000-000000000612',
    'Registration opens for community learning circle',
    'Events',
    'A new learning circle is open for registration with limited seats for active members.',
    'Pergas members may register for the upcoming community learning circle through the events page. Priority access will be given to active members during the first registration window.',
    now() - interval '1 day',
    '3 min read',
    false,
    true,
    'published'
  ),
  (
    '00000000-0000-0000-0000-000000000613',
    'Community guidelines for respectful discussion',
    'Community',
    'A reminder that all discussion threads are moderated to keep exchanges respectful, relevant and beneficial.',
    'Members are welcome to ask questions, share reflections and respond to announcements. Comments should remain respectful, relevant to the thread and aligned with Pergas'' professional tone. Comments may be held for moderator review before publication.',
    now() - interval '3 days',
    '4 min read',
    true,
    true,
    'published'
  )
on conflict (id) do nothing;

insert into public.uc6_discussion_threads (
  id,
  group_id,
  author_name,
  title,
  body,
  votes,
  has_image,
  status,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000621',
    '00000000-0000-0000-0000-000000000601',
    'Brother Ahmad',
    'Thoughts on the upcoming Majlis Ilmu?',
    'I am really looking forward to the community gathering next Saturday. The topic of sustainable living within our faith tradition feels timely.',
    142,
    false,
    'approved',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000622',
    '00000000-0000-0000-0000-000000000602',
    'Sister Mariam',
    'A short reflection after class',
    'Today reminded me how small consistent acts can make community learning more meaningful.',
    76,
    false,
    'approved',
    now() - interval '4 hours'
  )
on conflict (id) do nothing;
