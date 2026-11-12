-- Tags, see apps/cms/src/lib/tags.ts. Articles may have any number of tags,
-- and tags may have any number of parent tags.
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- Same format as articles.body, see apps/cms/src/lib/body.ts, but only
  -- paragraphs with links, and lists. Empty means no description.
  description jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tags_description_is_array
    check (jsonb_typeof(description) = 'array')
);

-- A tag's parents. position keeps the order they were picked in. Cycles are
-- prevented by set_tag_parents below.
create table if not exists public.tag_parents (
  tag_id uuid not null,
  parent_id uuid not null,
  position int not null default 0,

  primary key (tag_id, parent_id),
  constraint tag_parents_tag_id_fkey
    foreign key (tag_id) references public.tags (id) on delete cascade,
  constraint tag_parents_parent_id_fkey
    foreign key (parent_id) references public.tags (id) on delete cascade,
  constraint tag_parents_not_self check (tag_id <> parent_id)
);

create index if not exists tag_parents_parent_idx
  on public.tag_parents (parent_id);

-- An article's tags. position keeps the order they were picked in.
create table if not exists public.article_tags (
  article_id uuid not null,
  tag_id uuid not null,
  position int not null default 0,

  primary key (article_id, tag_id),
  constraint article_tags_article_id_fkey
    foreign key (article_id) references public.articles (id) on delete cascade,
  constraint article_tags_tag_id_fkey
    foreign key (tag_id) references public.tags (id) on delete cascade
);

create index if not exists article_tags_tag_idx
  on public.article_tags (tag_id);

-- RLS on: the cms uses the service role key (bypasses RLS), the site uses the
-- anon key. Tags have no published state, so all of them are readable, while
-- an article's tags are only readable when the article is.
alter table public.tags enable row level security;
alter table public.tag_parents enable row level security;
alter table public.article_tags enable row level security;

drop policy if exists "Tags are readable by everyone" on public.tags;
create policy "Tags are readable by everyone"
  on public.tags for select
  to anon
  using (true);

drop policy if exists "Tag parents are readable by everyone"
  on public.tag_parents;
create policy "Tag parents are readable by everyone"
  on public.tag_parents for select
  to anon
  using (true);

drop policy if exists "Tags of published articles are readable by everyone"
  on public.article_tags;
create policy "Tags of published articles are readable by everyone"
  on public.article_tags for select
  to anon
  using (
    exists (
      select 1 from public.articles
        where articles.id = article_tags.article_id
          and articles.published = true
    )
  );

-- Replaces an article's tags in one transaction, in the given order. Ids of
-- tags that don't exist, e.g. ones deleted meanwhile, are skipped. Returns the
-- tag ids that were set.
create or replace function public.set_article_tags(
  article_id uuid,
  tag_ids uuid[]
)
returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result uuid[];
begin
  delete from public.article_tags
    where article_tags.article_id = set_article_tags.article_id;

  insert into public.article_tags (article_id, tag_id, position)
    select set_article_tags.article_id, ids.tag_id, min(ids.position)
    from unnest(tag_ids) with ordinality as ids (tag_id, position)
    join public.tags on tags.id = ids.tag_id
    group by ids.tag_id;

  select coalesce(array_agg(article_tags.tag_id order by article_tags.position), '{}')
    into result
    from public.article_tags
    where article_tags.article_id = set_article_tags.article_id;

  return result;
end;
$$;

revoke execute on function public.set_article_tags(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.set_article_tags(uuid, uuid[])
  to service_role;

-- Replaces a tag's parents in one transaction, in the given order. Ids of tags
-- that don't exist, and the tag itself, are skipped. Raises check_violation
-- (23514) if a parent is one of the tag's descendants. Returns the parent ids
-- that were set.
create or replace function public.set_tag_parents(
  tag_id uuid,
  parent_ids uuid[]
)
returns uuid[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result uuid[];
begin
  delete from public.tag_parents
    where tag_parents.tag_id = set_tag_parents.tag_id;

  insert into public.tag_parents (tag_id, parent_id, position)
    select set_tag_parents.tag_id, ids.parent_id, min(ids.position)
    from unnest(parent_ids) with ordinality as ids (parent_id, position)
    join public.tags on tags.id = ids.parent_id
    where ids.parent_id <> set_tag_parents.tag_id
    group by ids.parent_id;

  -- The tag may not be among its own ancestors.
  if exists (
    with recursive ancestors (id) as (
      select tag_parents.parent_id
        from public.tag_parents
        where tag_parents.tag_id = set_tag_parents.tag_id
      union
      select tag_parents.parent_id
        from public.tag_parents
        join ancestors on tag_parents.tag_id = ancestors.id
    )
    select 1 from ancestors where ancestors.id = set_tag_parents.tag_id
  ) then
    raise exception 'A tag can''t be its own ancestor'
      using errcode = 'check_violation';
  end if;

  select coalesce(array_agg(tag_parents.parent_id order by tag_parents.position), '{}')
    into result
    from public.tag_parents
    where tag_parents.tag_id = set_tag_parents.tag_id;

  return result;
end;
$$;

revoke execute on function public.set_tag_parents(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.set_tag_parents(uuid, uuid[])
  to service_role;

-- Moves a tag to the trash in one transaction, see db/002_trash.sql. Its
-- links are deleted along with it, so they're kept in the trashed data as
-- parent_ids, child_ids and article_ids, for a restore to put back. Returns
-- false if there was no tag with that id.
create or replace function public.trash_tag(tag_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trashed jsonb;
begin
  select to_jsonb(tags) || jsonb_build_object(
      'parent_ids', coalesce((
        select jsonb_agg(tag_parents.parent_id order by tag_parents.position)
          from public.tag_parents
          where tag_parents.tag_id = tags.id
      ), '[]'::jsonb),
      'child_ids', coalesce((
        select jsonb_agg(tag_parents.tag_id)
          from public.tag_parents
          where tag_parents.parent_id = tags.id
      ), '[]'::jsonb),
      'article_ids', coalesce((
        select jsonb_agg(article_tags.article_id)
          from public.article_tags
          where article_tags.tag_id = tags.id
      ), '[]'::jsonb)
    )
    into trashed
    from public.tags
    where tags.id = trash_tag.tag_id;

  if trashed is null then
    return false;
  end if;

  delete from public.tags where tags.id = trash_tag.tag_id;

  insert into public.trash (document_type, document_id, data)
    values ('tag', trash_tag.tag_id, trashed);

  return true;
end;
$$;

revoke execute on function public.trash_tag(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_tag(uuid) to service_role;

-- Replaces the function from db/002_trash.sql, so the article's tags are kept
-- in the trashed data as tag_ids, since they're deleted along with it.
create or replace function public.trash_article(article_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trashed jsonb;
begin
  select to_jsonb(articles) || jsonb_build_object(
      'tag_ids', coalesce((
        select jsonb_agg(article_tags.tag_id order by article_tags.position)
          from public.article_tags
          where article_tags.article_id = articles.id
      ), '[]'::jsonb)
    )
    into trashed
    from public.articles
    where articles.id = trash_article.article_id;

  if trashed is null then
    return false;
  end if;

  delete from public.articles where articles.id = trash_article.article_id;

  insert into public.trash (document_type, document_id, data)
    values ('article', trash_article.article_id, trashed);

  return true;
end;
$$;

revoke execute on function public.trash_article(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_article(uuid) to service_role;
