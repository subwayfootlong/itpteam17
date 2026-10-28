-- Issue #64, commit 1. Apply after the existing notifications schema.
-- Run as the database owner in Supabase SQL Editor. No historical email backfill.
begin;

alter table public.notification_preferences
  add column if not exists email_enabled boolean not null default false;

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('rsvp')),
  user_id uuid not null references public.users(id) on delete cascade,
  source_id uuid not null,
  source_version timestamptz,
  dedupe_key text not null unique,
  status text not null default 'pending' check (status in ('pending','processing','sent','skipped','failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  last_error text check (last_error in ('delivery_failed','lease_expired'))
);
create index if not exists email_outbox_pending on public.email_outbox(available_at, created_at)
  where status in ('pending','processing');
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.email_outbox to service_role;

-- Runs inside the registration transaction: an unsuccessful/rolled-back write
-- cannot leave a deliverable job. No network calls or SMTP in this trigger.
create or replace function public.queue_rsvp_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'registered' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'registered' then return new; end if;
  end if;
  if not exists (
    select 1 from public.users u
    join public.notification_preferences p on p.user_id = u.id
    join public.events e on e.id = new.event_id
    where u.id = new.user_id and u.role = 'member' and p.email_enabled
      and e.status = 'published' and nullif(btrim(e.external_rsvp_url), '') is null
  ) then return new; end if;
  insert into public.email_outbox(kind, user_id, source_id, source_version, dedupe_key)
    values ('rsvp', new.user_id, new.id, new.registered_at,
      'rsvp:' || new.id::text || ':' || coalesce(extract(epoch from new.registered_at)::text, 'initial'))
    on conflict (dedupe_key) do nothing;
  return new;
end;
$$;
revoke all on function public.queue_rsvp_email() from public, anon, authenticated;
drop trigger if exists email_rsvp_registered on public.event_registrations;
create trigger email_rsvp_registered after insert or update of status on public.event_registrations
  for each row execute function public.queue_rsvp_email();

-- One short job per call, safe across simultaneous serverless workers.
create or replace function public.claim_transactional_email()
returns table(id uuid, kind text, user_id uuid, source_id uuid, source_version timestamptz, lease_token uuid)
language plpgsql security definer set search_path = '' as $$
begin
  update public.email_outbox o set status = 'failed', last_error = 'lease_expired',
    lease_token = null, lease_until = null, completed_at = now()
    where o.status = 'processing' and o.lease_until < now() and o.attempts >= 5;
  return query
  with candidate as (
    select o.id from public.email_outbox o
    where o.attempts < 5 and (
      (o.status = 'pending' and o.available_at <= now()) or
      (o.status = 'processing' and o.lease_until < now())
    ) order by o.available_at, o.created_at
    for update skip locked limit 1
  )
  update public.email_outbox o set status = 'processing', attempts = o.attempts + 1,
    lease_token = gen_random_uuid(), lease_until = now() + interval '5 minutes'
    from candidate c where o.id = c.id
    returning o.id, o.kind, o.user_id, o.source_id, o.source_version, o.lease_token;
end;
$$;

create or replace function public.finish_transactional_email(p_id uuid, p_lease uuid, p_result text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if p_result not in ('sent','skipped','retry') then raise exception 'Invalid result'; end if;
  update public.email_outbox o set
    status = case when p_result <> 'retry' then p_result when o.attempts >= 5 then 'failed' else 'pending' end,
    available_at = now() + (least(3600, 60 * power(2, o.attempts - 1)) * interval '1 second'),
    last_error = case when p_result = 'retry' then 'delivery_failed' else null end,
    completed_at = case when p_result <> 'retry' or o.attempts >= 5 then now() else null end,
    lease_token = null, lease_until = null
    where o.id = p_id and o.lease_token = p_lease and o.status = 'processing' and o.lease_until > now();
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;
revoke all on function public.claim_transactional_email() from public, anon, authenticated;
revoke all on function public.finish_transactional_email(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.claim_transactional_email() to service_role;
grant execute on function public.finish_transactional_email(uuid,uuid,text) to service_role;
notify pgrst, 'reload schema';
commit;
