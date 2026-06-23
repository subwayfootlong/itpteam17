-- Registration profile fields and removal of redundant full_name column
-- Run once in Supabase SQL Editor.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists organization text,
  add column if not exists designation text,
  add column if not exists phone text;

-- Migrate any legacy full_name values into first/last when missing
update public.users
set
  first_name = coalesce(
    first_name,
    split_part(trim(full_name), ' ', 1)
  ),
  last_name = coalesce(
    last_name,
    nullif(trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1)), '')
  )
where full_name is not null
  and trim(full_name) <> ''
  and (first_name is null or last_name is null);

alter table public.users drop column if exists full_name;

-- Align membership_tier check constraint with app tiers (includes basic)
alter table public.users drop constraint if exists users_membership_tier_check;

alter table public.users
  add constraint users_membership_tier_check
  check (membership_tier in ('basic', 'ordinary', 'associate', 'student'));

alter table public.users
  alter column membership_tier set default 'basic';
