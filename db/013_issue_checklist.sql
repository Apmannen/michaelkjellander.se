-- Checkboxes of an issue, see apps/cms/src/lib/issues.ts. A json array of
-- { id, text, checked } in the order they're shown. trash_issue keeps them in
-- the trashed data through to_jsonb(issues).
alter table public.issues
  add column if not exists checklist jsonb not null default '[]'::jsonb;

alter table public.issues
  drop constraint if exists issues_checklist_is_array;

alter table public.issues
  add constraint issues_checklist_is_array
    check (jsonb_typeof(checklist) = 'array');

-- create_issue from db/006_issues.sql, now with the checklist.
drop function if exists public.create_issue(text, uuid, text, text);

create or replace function public.create_issue(
  site_id text,
  column_id uuid,
  title text,
  text text,
  checklist jsonb
)
returns public.issues
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_number int;
  result public.issues;
begin
  if not exists (
    select 1 from public.issue_columns
      where issue_columns.id = create_issue.column_id
        and issue_columns.site_id = create_issue.site_id
  ) then
    raise exception 'The column isn''t on the site''s board'
      using errcode = 'foreign_key_violation';
  end if;

  -- Also locks the site until the issue is created, see move_issue.
  update public.sites
    set last_issue_number = sites.last_issue_number + 1
    where sites.id = create_issue.site_id
    returning sites.last_issue_number into next_number;

  insert into public.issues
      (site_id, number, column_id, position, title, text, checklist)
    select create_issue.site_id, next_number, create_issue.column_id,
        count(*), create_issue.title, create_issue.text,
        create_issue.checklist
      from public.issues
      where issues.column_id = create_issue.column_id
    returning * into result;

  return result;
end;
$$;

revoke execute on function public.create_issue(text, uuid, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_issue(text, uuid, text, text, jsonb)
  to service_role;
