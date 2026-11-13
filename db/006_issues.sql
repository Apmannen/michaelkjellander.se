-- Issues, see apps/cms/src/lib/issues.ts. Every site has one board, made up
-- of the site's issue columns. Every issue is in one of the columns.
create table if not exists public.issue_columns (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  name text not null,
  -- The column's place on the board, from the left. Kept as 0, 1, 2… by the
  -- functions below.
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint issue_columns_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict
);

create index if not exists issue_columns_site_idx
  on public.issue_columns (site_id, position);

-- The numbers of the site's issues, e.g. 22 in MK-22, are counted here, so
-- numbers of deleted issues aren't used again.
alter table public.sites
  add column if not exists last_issue_number int not null default 0;

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  -- Shown with the site's id as prefix, e.g. MK-22. Set by create_issue.
  number int not null,
  -- A column can't be deleted while it has issues.
  column_id uuid not null,
  -- The issue's place in its column, from the top. Kept as 0, 1, 2… by the
  -- functions below.
  position int not null default 0,
  title text not null,
  -- Plain text, may contain line breaks. Empty means no text.
  text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint issues_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict,
  constraint issues_column_id_fkey
    foreign key (column_id) references public.issue_columns (id)
      on delete restrict,
  constraint issues_site_id_number_key unique (site_id, number)
);

create index if not exists issues_column_idx
  on public.issues (column_id, position);

-- RLS on without policies: the board is only for the cms (service role).
alter table public.issue_columns enable row level security;
alter table public.issues enable row level security;

-- Adds a column last on the site's board. Returns the new column.
create or replace function public.create_issue_column(
  site_id text,
  name text
)
returns public.issue_columns
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.issue_columns;
begin
  -- Locks the site, so columns added at the same time get their own
  -- positions.
  perform 1 from public.sites
    where sites.id = create_issue_column.site_id
    for update;

  insert into public.issue_columns (site_id, name, position)
    select create_issue_column.site_id, create_issue_column.name, count(*)
      from public.issue_columns
      where issue_columns.site_id = create_issue_column.site_id
    returning * into result;

  return result;
end;
$$;

revoke execute on function public.create_issue_column(text, text)
  from public, anon, authenticated;
grant execute on function public.create_issue_column(text, text)
  to service_role;

-- Moves a column to the given position on its board, counted among the
-- other columns. Positions out of range put it first or last. Returns false
-- if there was no column with that id.
create or replace function public.move_issue_column(
  column_id uuid,
  position int
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  board text;
begin
  select issue_columns.site_id into board
    from public.issue_columns
    where issue_columns.id = move_issue_column.column_id;

  if board is null then
    return false;
  end if;

  -- Locks the site, so moves at the same time don't mix up the positions.
  perform 1 from public.sites where sites.id = board for update;

  with others as (
    select issue_columns.id,
        row_number() over (
          order by issue_columns.position, issue_columns.created_at
        ) - 1 as place
      from public.issue_columns
      where issue_columns.site_id = board
        and issue_columns.id <> move_issue_column.column_id
  ), ordered as (
    select others.id,
        case when others.place >= move_issue_column.position
          then others.place + 1
          else others.place
        end as position
      from others
    union all
    select move_issue_column.column_id,
        least(
          greatest(move_issue_column.position, 0),
          (select count(*) from others)
        )
  )
  update public.issue_columns
    set position = ordered.position
    from ordered
    where issue_columns.id = ordered.id;

  return true;
end;
$$;

revoke execute on function public.move_issue_column(uuid, int)
  from public, anon, authenticated;
grant execute on function public.move_issue_column(uuid, int)
  to service_role;

-- Deletes an empty column and closes the gap after it. Raises
-- foreign_key_violation (23503) if the column has issues. Returns false if
-- there was no column with that id.
create or replace function public.delete_issue_column(column_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  board text;
begin
  delete from public.issue_columns
    where issue_columns.id = delete_issue_column.column_id
    returning issue_columns.site_id into board;

  if board is null then
    return false;
  end if;

  with ordered as (
    select issue_columns.id,
        row_number() over (
          order by issue_columns.position, issue_columns.created_at
        ) - 1 as position
      from public.issue_columns
      where issue_columns.site_id = board
  )
  update public.issue_columns
    set position = ordered.position
    from ordered
    where issue_columns.id = ordered.id;

  return true;
end;
$$;

revoke execute on function public.delete_issue_column(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_issue_column(uuid)
  to service_role;

-- Creates an issue last in the given column, with the site's next number.
-- Raises foreign_key_violation (23503) if the column isn't on the site's
-- board. Returns the new issue.
create or replace function public.create_issue(
  site_id text,
  column_id uuid,
  title text,
  text text
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

  insert into public.issues (site_id, number, column_id, position, title, text)
    select create_issue.site_id, next_number, create_issue.column_id,
        count(*), create_issue.title, create_issue.text
      from public.issues
      where issues.column_id = create_issue.column_id
    returning * into result;

  return result;
end;
$$;

revoke execute on function public.create_issue(text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_issue(text, uuid, text, text)
  to service_role;

-- Gives the issues of a column positions 0, 1, 2… in their current order.
create or replace function public.renumber_issues(column_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  with ordered as (
    select issues.id,
        row_number() over (
          order by issues.position, issues.created_at
        ) - 1 as position
      from public.issues
      where issues.column_id = renumber_issues.column_id
  )
  update public.issues
    set position = ordered.position
    from ordered
    where issues.id = ordered.id
      and issues.position <> ordered.position;
$$;

revoke execute on function public.renumber_issues(uuid)
  from public, anon, authenticated;
grant execute on function public.renumber_issues(uuid) to service_role;

-- Moves an issue to the given position in the given column, counted among
-- the column's other issues. Positions out of range put it first or last.
-- Raises foreign_key_violation (23503) if the column isn't on the issue's
-- site's board. Returns false if there was no issue with that id.
create or replace function public.move_issue(
  issue_id uuid,
  column_id uuid,
  position int
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  board text;
  old_column_id uuid;
begin
  select issues.site_id into board
    from public.issues
    where issues.id = move_issue.issue_id;

  if board is null then
    return false;
  end if;

  -- Locks the site, so moves at the same time don't mix up the positions.
  perform 1 from public.sites where sites.id = board for update;

  select issues.column_id into old_column_id
    from public.issues
    where issues.id = move_issue.issue_id;

  if not exists (
    select 1 from public.issue_columns
      where issue_columns.id = move_issue.column_id
        and issue_columns.site_id = board
  ) then
    raise exception 'The column isn''t on the issue''s site''s board'
      using errcode = 'foreign_key_violation';
  end if;

  with others as (
    select issues.id,
        row_number() over (
          order by issues.position, issues.created_at
        ) - 1 as place
      from public.issues
      where issues.column_id = move_issue.column_id
        and issues.id <> move_issue.issue_id
  ), ordered as (
    select others.id,
        case when others.place >= move_issue.position
          then others.place + 1
          else others.place
        end as position
      from others
    union all
    select move_issue.issue_id,
        least(
          greatest(move_issue.position, 0),
          (select count(*) from others)
        )
  )
  update public.issues
    set column_id = move_issue.column_id,
      position = ordered.position
    from ordered
    where issues.id = ordered.id;

  if old_column_id <> move_issue.column_id then
    perform public.renumber_issues(old_column_id);
  end if;

  return true;
end;
$$;

revoke execute on function public.move_issue(uuid, uuid, int)
  from public, anon, authenticated;
grant execute on function public.move_issue(uuid, uuid, int)
  to service_role;

-- Moves an issue to the trash in one transaction, see db/002_trash.sql, and
-- closes the gap after it in its column. Returns false if there was no issue
-- with that id.
create or replace function public.trash_issue(issue_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trashed jsonb;
begin
  delete from public.issues
    where issues.id = trash_issue.issue_id
    returning to_jsonb(issues) into trashed;

  if trashed is null then
    return false;
  end if;

  insert into public.trash (document_type, document_id, site_id, data)
    values ('issue', trash_issue.issue_id, trashed->>'site_id', trashed);

  perform public.renumber_issues((trashed->>'column_id')::uuid);

  return true;
end;
$$;

revoke execute on function public.trash_issue(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_issue(uuid) to service_role;
