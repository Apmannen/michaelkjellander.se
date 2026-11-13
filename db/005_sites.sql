-- Sites, see apps/cms/src/lib/sites.ts. The cms manages the documents of
-- several sites, and every article and tag belongs to one of them.
create table if not exists public.sites (
  -- Picked when the site is created, e.g. 'mk'. Used in the cms's URLs, and
  -- can't be changed afterwards.
  id text primary key,
  -- Shown in the cms's site menu.
  name text not null,
  -- Where the site runs, e.g. 'https://example.com'. Triggers are sent here.
  -- Empty until set in the cms.
  url text not null default '',
  -- Sent as a bearer token when running triggers on the site. Empty until set
  -- in the cms.
  api_secret text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Same format as slugs. 'sites' is taken by the cms's own route for
  -- creating sites.
  constraint sites_id_format
    check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and id <> 'sites')
);

-- RLS on without policies: the table holds the sites' API secrets, so only
-- the cms (service role) may touch it.
alter table public.sites enable row level security;

insert into public.sites (id, name)
values
  ('mk', 'mk'),
  ('shellander', 'shellander')
on conflict (id) do nothing;

-- Articles and tags belong to a site. Existing ones belonged to 'mk'. A site
-- can't be deleted while it has any.
alter table public.articles
  add column if not exists site_id text;
update public.articles set site_id = 'mk' where site_id is null;
alter table public.articles
  alter column site_id set not null;
alter table public.articles
  drop constraint if exists articles_site_id_fkey;
alter table public.articles
  add constraint articles_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict;

alter table public.tags
  add column if not exists site_id text;
update public.tags set site_id = 'mk' where site_id is null;
alter table public.tags
  alter column site_id set not null;
alter table public.tags
  drop constraint if exists tags_site_id_fkey;
alter table public.tags
  add constraint tags_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict;

-- Slugs only need to be unique within a site. The new constraints' index
-- also serves lookups by site.
alter table public.articles
  drop constraint if exists articles_slug_key;
alter table public.articles
  drop constraint if exists articles_site_id_slug_key;
alter table public.articles
  add constraint articles_site_id_slug_key unique (site_id, slug);

alter table public.tags
  drop constraint if exists tags_slug_key;
alter table public.tags
  drop constraint if exists tags_site_id_slug_key;
alter table public.tags
  add constraint tags_site_id_slug_key unique (site_id, slug);

-- The trash keeps which site a document belonged to, so it can be listed per
-- site. No foreign key, so trashed documents don't keep a site from being
-- deleted.
alter table public.trash
  add column if not exists site_id text;
update public.trash
  set site_id = data->>'site_id'
  where site_id is null;
create index if not exists trash_site_idx
  on public.trash (site_id);

-- Replaces the function from db/004_tags.sql. Only tags of the article's own
-- site are set, others are skipped like tags that don't exist.
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
    join public.articles on articles.id = set_article_tags.article_id
    where tags.site_id = articles.site_id
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

-- Replaces the function from db/004_tags.sql. Only tags of the tag's own site
-- are set as parents, others are skipped like tags that don't exist.
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
    join public.tags as parents on parents.id = ids.parent_id
    join public.tags as self on self.id = set_tag_parents.tag_id
    where ids.parent_id <> set_tag_parents.tag_id
      and parents.site_id = self.site_id
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

-- Replaces the function from db/004_tags.sql, so the trash gets the site.
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

  insert into public.trash (document_type, document_id, site_id, data)
    values ('article', trash_article.article_id, trashed->>'site_id', trashed);

  return true;
end;
$$;

revoke execute on function public.trash_article(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_article(uuid) to service_role;

-- Replaces the function from db/004_tags.sql, so the trash gets the site.
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

  insert into public.trash (document_type, document_id, site_id, data)
    values ('tag', trash_tag.tag_id, trashed->>'site_id', trashed);

  return true;
end;
$$;

revoke execute on function public.trash_tag(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_tag(uuid) to service_role;
