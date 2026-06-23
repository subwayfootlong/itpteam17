-- UC-02: Backfill existing users with membership defaults
-- Run once in Supabase SQL Editor after deploying UC-02 code changes.

update public.users
set
  role = coalesce(role, 'member'),
  membership_tier = case
    when membership_tier is null or membership_tier = '' then 'basic'
    when membership_tier in ('fellow', 'professional') then 'basic'
    else membership_tier
  end,
  membership_status = coalesce(membership_status, 'active')
where role is null
   or membership_tier is null
   or membership_tier = ''
   or membership_tier in ('fellow', 'professional')
   or membership_status is null;

alter table public.users
  alter column membership_tier set default 'basic';
