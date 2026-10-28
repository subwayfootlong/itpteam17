-- Issue #64, commit 2. Apply AFTER supabase-transactional-email.sql.
begin;
alter table public.email_outbox drop constraint if exists email_outbox_kind_check;
alter table public.email_outbox add constraint email_outbox_kind_check check (kind in ('rsvp','announcement'));

-- Track the start of the current opt-in period; late opt-ins do not receive old publications.
alter table public.notification_preferences add column if not exists email_enabled_since timestamptz;
update public.notification_preferences set email_enabled_since = now()
  where email_enabled and email_enabled_since is null;
create or replace function public.record_email_consent() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not new.email_enabled then new.email_enabled_since := null;
  elsif tg_op = 'INSERT' then new.email_enabled_since := now();
  elsif not old.email_enabled then new.email_enabled_since := now();
  else new.email_enabled_since := old.email_enabled_since;
  end if;
  return new;
end;
$$;
revoke all on function public.record_email_consent() from public, anon, authenticated;
drop trigger if exists email_consent_timestamp on public.notification_preferences;
create trigger email_consent_timestamp before insert or update on public.notification_preferences
  for each row execute function public.record_email_consent();

create table if not exists public.announcement_email_publications (
  source_id uuid primary key references public.announcements(id) on delete cascade,
  audience_type text not null,
  eligible_tiers text[] not null,
  published_at timestamptz not null default now(),
  cursor_id uuid,
  status text not null default 'pending' check (status in ('pending','processing','complete')),
  lease_token uuid,
  lease_until timestamptz
);
alter table public.announcement_email_publications enable row level security;
revoke all on public.announcement_email_publications from public, anon, authenticated;
grant select, insert, update, delete on public.announcement_email_publications to service_role;

-- No historical sends on deployment, including archived announcements later republished.
insert into public.announcement_email_publications(source_id,audience_type,eligible_tiers,status)
  select id, coalesce(audience_type,'all'), coalesce(eligible_tiers,'{}'), 'complete'
  from public.announcements where status in ('published','archived')
  on conflict (source_id) do nothing;

create or replace function public.queue_announcement_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'published' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'published' then return new; end if;
  end if;
  insert into public.announcement_email_publications(source_id,audience_type,eligible_tiers)
    values (new.id, coalesce(new.audience_type,'all'), coalesce(new.eligible_tiers,'{}'))
    on conflict (source_id) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_announcement_publication() from public, anon, authenticated;
drop trigger if exists email_announcement_published on public.announcements;
create trigger email_announcement_published after insert or update of status on public.announcements
  for each row execute function public.queue_announcement_publication();

create or replace function public.claim_announcement_email_batch()
returns table(source_id uuid, audience_type text, eligible_tiers text[], published_at timestamptz, cursor_id uuid, lease_token uuid)
language plpgsql security definer set search_path = '' as $$
begin
  return query
  with candidate as (
    select p.source_id from public.announcement_email_publications p
    where p.status = 'pending' or (p.status = 'processing' and p.lease_until < now())
    order by p.published_at for update skip locked limit 1
  )
  update public.announcement_email_publications p set status = 'processing',
    lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes'
    from candidate c where p.source_id = c.source_id
    returning p.source_id,p.audience_type,p.eligible_tiers,p.published_at,p.cursor_id,p.lease_token;
end;
$$;

-- Commit recipients and progress together. A crash cannot advance past an unqueued page.
create or replace function public.finish_announcement_email_batch(
  p_source uuid, p_lease uuid, p_recipients uuid[], p_cursor uuid, p_done boolean
) returns boolean language plpgsql security definer set search_path = '' as $$
declare publication public.announcement_email_publications;
begin
  select * into publication from public.announcement_email_publications p
    where p.source_id = p_source and p.lease_token = p_lease and p.status = 'processing'
      and p.lease_until > now() for update;
  if not found then return false; end if;
  if cardinality(p_recipients) > 100 or
    (p_cursor is not null and publication.cursor_id is not null and p_cursor < publication.cursor_id)
    then raise exception 'Invalid email batch'; end if;
  insert into public.email_outbox(kind,user_id,source_id,dedupe_key)
    select 'announcement', u.id, p_source, 'announcement:' || p_source::text || ':' || u.id::text
    from public.users u join public.notification_preferences pref on pref.user_id = u.id
    where u.id = any(p_recipients) and u.role = 'member' and pref.email_enabled
      and pref.email_enabled_since <= publication.published_at
      and u.created_at <= publication.published_at
      and (publication.cursor_id is null or u.id > publication.cursor_id) and u.id <= p_cursor
    on conflict (dedupe_key) do nothing;
  update public.announcement_email_publications set cursor_id = coalesce(p_cursor,publication.cursor_id),
    status = case when p_done then 'complete' else 'pending' end, lease_token = null, lease_until = null
    where source_id = p_source;
  return true;
end;
$$;
revoke all on function public.claim_announcement_email_batch() from public, anon, authenticated;
revoke all on function public.finish_announcement_email_batch(uuid,uuid,uuid[],uuid,boolean) from public, anon, authenticated;
grant execute on function public.claim_announcement_email_batch() to service_role;
grant execute on function public.finish_announcement_email_batch(uuid,uuid,uuid[],uuid,boolean) to service_role;
notify pgrst, 'reload schema';
commit;
