-- Salutation and ARS status fields for member registration
-- Run once in Supabase SQL Editor.

alter table public.users
  add column if not exists salutation text,
  add column if not exists ars_status text;

alter table public.users drop constraint if exists users_salutation_check;
alter table public.users
  add constraint users_salutation_check
  check (salutation is null or salutation in ('mr', 'ms', 'ustaz', 'ustazah'));

alter table public.users drop constraint if exists users_ars_status_check;
alter table public.users
  add constraint users_ars_status_check
  check (ars_status is null or ars_status in ('no', 'active', 'pending', 'expired'));

alter table public.users
  alter column ars_status set default 'no';
