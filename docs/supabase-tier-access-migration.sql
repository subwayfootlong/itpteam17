-- Tier-based content access
-- Existing records remain available to every active member.

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'benefits',
    'events',
    'announcements',
    'discussion_groups'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists audience_type text not null default ''all''',
      table_name
    );
    execute format(
      'alter table public.%I add column if not exists eligible_tiers text[] not null default ''{}''::text[]',
      table_name
    );
    execute format(
      'alter table public.%I add column if not exists show_locked_preview boolean not null default false',
      table_name
    );
    execute format(
      'alter table public.%I drop constraint if exists %I',
      table_name,
      table_name || '_audience_type_check'
    );
    execute format(
      'alter table public.%I add constraint %I check (audience_type in (''all'', ''selected_tiers''))',
      table_name,
      table_name || '_audience_type_check'
    );
    execute format(
      'alter table public.%I drop constraint if exists %I',
      table_name,
      table_name || '_eligible_tiers_check'
    );
    execute format(
      'alter table public.%I add constraint %I check (
        eligible_tiers <@ array[''basic'', ''student'', ''associate'', ''ordinary'']::text[]
        and (
          audience_type = ''all''
          or cardinality(eligible_tiers) > 0
        )
      )',
      table_name,
      table_name || '_eligible_tiers_check'
    );
  end loop;
end $$;

update public.benefits
set audience_type = 'all', eligible_tiers = '{}', show_locked_preview = false
where audience_type is null;

update public.events
set audience_type = 'all', eligible_tiers = '{}', show_locked_preview = false
where audience_type is null;

update public.announcements
set audience_type = 'all', eligible_tiers = '{}', show_locked_preview = false
where audience_type is null;

update public.discussion_groups
set audience_type = 'all', eligible_tiers = '{}', show_locked_preview = false
where audience_type is null;

create index if not exists benefits_audience_type_idx
  on public.benefits (audience_type);
create index if not exists events_audience_type_idx
  on public.events (audience_type);
create index if not exists announcements_audience_type_idx
  on public.announcements (audience_type);
create index if not exists discussion_groups_audience_type_idx
  on public.discussion_groups (audience_type);
