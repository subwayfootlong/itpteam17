-- Run before deploying email change. Resolve existing case-insensitive duplicates first.
-- Safe to rerun after partial setup: existing tables and their rows are preserved.
begin;
create unique index if not exists users_email_normalized_unique
  on public.users (lower(btrim(email)));

create table if not exists public.email_change_requests (
  user_id uuid primary key references public.users(id) on delete cascade,
  id uuid not null unique,
  old_email text not null,
  new_email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  verified_at timestamptz
);
create table if not exists public.email_change_limits (
  user_id uuid primary key references public.users(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  last_sent_at timestamptz
);
create table if not exists public.email_change_notifications (
  id uuid primary key,
  old_email text not null,
  new_email text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.email_change_requests enable row level security;
alter table public.email_change_limits enable row level security;
alter table public.email_change_notifications enable row level security;
revoke all on public.email_change_requests, public.email_change_limits, public.email_change_notifications from anon, authenticated;
grant all on public.email_change_requests, public.email_change_limits, public.email_change_notifications to service_role;

-- Also limits wrong-password requests, across application instances.
create or replace function public.email_change_throttle(p_user_id uuid) returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.email_change_limits;
begin
  insert into email_change_limits(user_id) values(p_user_id) on conflict do nothing;
  select * into v from email_change_limits where user_id=p_user_id for update;
  if v.window_start <= now()-interval '1 hour' then
    update email_change_limits set window_start=now(), request_count=1 where user_id=p_user_id;
    return true;
  end if;
  if v.request_count >= 10 then return false; end if;
  update email_change_limits set request_count=request_count+1 where user_id=p_user_id;
  return true;
end $$;

create or replace function public.email_change_start(p_user_id uuid, p_old_email text, p_new_email text,
  p_id uuid, p_otp_hash text, p_password_hash text) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_email text; v_password text; v_sent timestamptz;
begin
  select email, password_hash into v_email, v_password from users where id=p_user_id for update;
  if v_email is distinct from p_old_email or v_password is distinct from p_password_hash then return 'session'; end if;
  select last_sent_at into v_sent from email_change_limits where user_id=p_user_id for update;
  if v_sent > now()-interval '60 seconds' then return 'cooldown'; end if;
  if exists(select 1 from users where lower(btrim(email))=p_new_email) then return 'duplicate'; end if;
  insert into email_change_requests(user_id,id,old_email,new_email,otp_hash,expires_at)
    values(p_user_id,p_id,p_old_email,p_new_email,p_otp_hash,now()+interval '10 minutes')
    on conflict(user_id) do update set id=excluded.id, old_email=excluded.old_email,
      new_email=excluded.new_email, otp_hash=excluded.otp_hash, expires_at=excluded.expires_at,
      attempt_count=0, created_at=now(), last_sent_at=now(), verified_at=null;
  update email_change_limits set last_sent_at=now() where user_id=p_user_id;
  return 'ok';
end $$;

-- Row locks serialize verification, resend, and competing changes for this member.
-- A unique normalized index also covers concurrent registrations of the new address.
create or replace function public.email_change_finish(p_user_id uuid, p_id uuid, p_matches boolean)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.email_change_requests; v_email text;
begin
  select email into v_email from users where id=p_user_id for update;
  select * into v from email_change_requests where user_id=p_user_id for update;
  if not found or v.id<>p_id or v.verified_at is not null then return 'missing'; end if;
  if v.old_email is distinct from v_email then return 'session'; end if;
  if v.expires_at<=now() then return 'expired'; end if;
  if v.attempt_count>=5 then return 'attempts'; end if;
  if p_matches is not true then
    update email_change_requests set attempt_count=attempt_count+1 where user_id=p_user_id;
    return case when v.attempt_count>=4 then 'attempts' else 'invalid' end;
  end if;
  if exists(select 1 from users where id<>p_user_id and lower(btrim(email))=v.new_email) then return 'duplicate'; end if;
  begin
    update users set email=v.new_email where id=p_user_id;
  exception when unique_violation then return 'duplicate'; end;
  update email_change_requests set verified_at=now(), otp_hash='' where user_id=p_user_id;
  insert into email_change_notifications(id,old_email,new_email) values(v.id,v.old_email,v.new_email);
  return 'ok';
end $$;

revoke all on function public.email_change_throttle(uuid) from public, anon, authenticated;
revoke all on function public.email_change_start(uuid,text,text,uuid,text,text) from public, anon, authenticated;
revoke all on function public.email_change_finish(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.email_change_throttle(uuid) to service_role;
grant execute on function public.email_change_start(uuid,text,text,uuid,text,text) to service_role;
grant execute on function public.email_change_finish(uuid,uuid,boolean) to service_role;
-- Refresh Supabase/PostgREST's function cache once this transaction commits.
notify pgrst, 'reload schema';
commit;
