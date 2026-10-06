-- Adds Reddit-style nested replies to the existing community comment table.
-- Run once in the Supabase SQL Editor before deploying the threaded UI.

alter table public.discussion_comments
  add column if not exists parent_comment_id uuid;

alter table public.discussion
  add column if not exists author_role text not null default 'Community Member';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'discussion_comments_parent_comment_id_fkey'
  ) then
    alter table public.discussion_comments
      add constraint discussion_comments_parent_comment_id_fkey
      foreign key (parent_comment_id)
      references public.discussion_comments(id)
      on delete cascade;
  end if;
end $$;

create index if not exists discussion_comments_parent_idx
  on public.discussion_comments(parent_comment_id, created_at);
