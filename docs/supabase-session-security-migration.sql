-- Apply before deploying the session-aware application. No existing JWT is grandfathered.
begin;
create table public.auth_sessions (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null,
  last_activity_at timestamptz not null,
  expires_at timestamptz not null,
  check (last_activity_at >= created_at),
  check (expires_at = created_at + interval '7 days')
);
create index auth_sessions_user_id_idx on public.auth_sessions(user_id);
create index auth_sessions_expires_at_idx on public.auth_sessions(expires_at);
alter table public.auth_sessions enable row level security;
revoke all on public.auth_sessions from public, anon, authenticated;
grant all on public.auth_sessions to service_role;

-- Every operation locks users first, then sessions. Password UPDATE already holds
-- the user lock; its trigger deletes sessions in the same transaction (also resets).
create function public.auth_sessions_credentials_changed() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.password_hash is distinct from old.password_hash or new.email is distinct from old.email then
    delete from auth_sessions where user_id=new.id;
  end if;
  return new;
end $$;
create trigger auth_sessions_credentials_changed after update of password_hash, email on public.users
for each row execute function public.auth_sessions_credentials_changed();

create function public.auth_session_create(p_user_id uuid, p_email text, p_password_hash text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare u public.users; t timestamptz;
begin
  select * into u from users where id=p_user_id for update;
  if not found or u.email is distinct from p_email or u.password_hash is distinct from p_password_hash then return false; end if;
  t := clock_timestamp();
  insert into auth_sessions values(p_id,p_user_id,t,t,t+interval '7 days');
  return true;
end $$;

create function public.auth_session_validate(p_user_id uuid, p_id uuid, p_email text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare u public.users; s public.auth_sessions; t timestamptz;
begin
  select * into u from users where id=p_user_id for update;
  if not found or u.email is distinct from p_email then return false; end if;
  select * into s from auth_sessions where id=p_id and user_id=p_user_id for update;
  if not found then return false; end if;
  t := clock_timestamp();
  if s.expires_at<=t or s.last_activity_at<=t-interval '15 minutes' or s.last_activity_at>t then
    delete from auth_sessions where id=p_id;
    return false;
  end if;
  update auth_sessions set last_activity_at=t where id=p_id;
  return true;
end $$;

create function public.auth_session_revoke(p_user_id uuid, p_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform 1 from users where id=p_user_id for update;
  delete from auth_sessions where id=p_id and user_id=p_user_id;
end $$;

create function public.auth_session_change_password(p_user_id uuid, p_id uuid, p_email text, p_old_hash text, p_new_hash text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Validation holds the user lock until this transaction finishes.
  if not auth_session_validate(p_user_id,p_id,p_email) then return false; end if;
  update users set password_hash=p_new_hash
    where id=p_user_id and role='member' and password_hash=p_old_hash;
  return found;
end $$;

revoke all on function public.auth_sessions_credentials_changed() from public, anon, authenticated;
revoke all on function public.auth_session_create(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.auth_session_validate(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.auth_session_revoke(uuid,uuid) from public, anon, authenticated;
revoke all on function public.auth_session_change_password(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.auth_session_create(uuid,text,text,uuid) to service_role;
grant execute on function public.auth_session_validate(uuid,uuid,text) to service_role;
grant execute on function public.auth_session_revoke(uuid,uuid) to service_role;
grant execute on function public.auth_session_change_password(uuid,uuid,text,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
