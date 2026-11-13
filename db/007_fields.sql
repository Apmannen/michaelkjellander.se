-- Dynamic fields, see apps/cms/src/lib/fields.ts. A site defines its fields,
-- e.g. play_also, and any of them can be added to the site's articles.
create table if not exists public.field_definitions (
  id uuid primary key default gen_random_uuid(),
  site_id text not null,
  -- What the site looks the field up by, e.g. 'play_also'. Unique within the
  -- site.
  key text not null,
  -- Shown in the cms, and may be shown on the site, e.g. 'Spela även'.
  label text not null,
  -- 'text': plain text, one line.
  -- 'link': a text that may link to an address or to another article of the
  --         same site.
  -- Can't be changed once the field is created, since the values depend on
  -- it.
  type text not null,
  -- Whether an article may have more than one value of the field.
  multiple boolean not null default false,
  -- Help text shown in the cms where the field is filled in. Empty means
  -- none.
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint field_definitions_site_id_fkey
    foreign key (site_id) references public.sites (id) on delete restrict,
  constraint field_definitions_site_id_key_key unique (site_id, key),
  constraint field_definitions_key_format
    check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint field_definitions_type_check
    check (type in ('text', 'link'))
);

-- An article's field values. position orders all of the article's values,
-- so the values of a field with multiple values keep their order.
create table if not exists public.article_field_values (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null,
  field_id uuid not null,
  position int not null default 0,
  text text not null,
  -- Only for link fields, and at most one of them. Neither means a link
  -- field's text isn't linked.
  href text,
  -- Cleared if the linked article is deleted, which keeps the text.
  target_article_id uuid,

  constraint article_field_values_article_id_fkey
    foreign key (article_id) references public.articles (id) on delete cascade,
  constraint article_field_values_field_id_fkey
    foreign key (field_id) references public.field_definitions (id)
      on delete cascade,
  constraint article_field_values_target_article_id_fkey
    foreign key (target_article_id) references public.articles (id)
      on delete set null,
  constraint article_field_values_one_link
    check (href is null or target_article_id is null)
);

create index if not exists article_field_values_article_idx
  on public.article_field_values (article_id, position);
create index if not exists article_field_values_field_idx
  on public.article_field_values (field_id);
create index if not exists article_field_values_target_idx
  on public.article_field_values (target_article_id);

-- RLS on: the cms uses the service role key (bypasses RLS), the site uses the
-- anon key. Field definitions have no published state, so all of them are
-- readable, while an article's values are only readable when the article is.
-- A linked article is only readable when it's published, so the site gets
-- null for one that isn't and can show the text without a link.
alter table public.field_definitions enable row level security;
alter table public.article_field_values enable row level security;

drop policy if exists "Field definitions are readable by everyone"
  on public.field_definitions;
create policy "Field definitions are readable by everyone"
  on public.field_definitions for select
  to anon
  using (true);

drop policy if exists "Field values of published articles are readable by everyone"
  on public.article_field_values;
create policy "Field values of published articles are readable by everyone"
  on public.article_field_values for select
  to anon
  using (
    exists (
      select 1 from public.articles
        where articles.id = article_field_values.article_id
          and articles.published = true
    )
  );

-- Replaces an article's field values in one transaction, in the given order.
-- field_values is an array of
--   { "field_id": "...", "text": "...", "href": "...",
--     "target_article_id": "..." }
-- where href and target_article_id may be left out. Skipped are values
-- without text, values of fields that don't exist or belong to another site,
-- and all but the first value of a field without multiple values. A text
-- field's links are dropped, and so is a link to an article that doesn't
-- exist, belongs to another site or is the article itself. A link to an
-- article wins over an address. Returns the values that were set, in the
-- same format.
create or replace function public.set_article_field_values(
  article_id uuid,
  field_values jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  delete from public.article_field_values
    where article_field_values.article_id = set_article_field_values.article_id;

  insert into public.article_field_values
    (article_id, field_id, position, text, href, target_article_id)
    select
      set_article_field_values.article_id,
      picked.field_id,
      picked.position - 1,
      picked.text,
      case
        when picked.type = 'link' and targets.id is null
          then nullif(picked.href, '')
      end,
      case when picked.type = 'link' then targets.id end
    from (
      select
        field_definitions.id as field_id,
        field_definitions.type,
        field_definitions.multiple,
        entries.position,
        entries.value->>'text' as text,
        entries.value->>'href' as href,
        (entries.value->>'target_article_id')::uuid as target_article_id,
        articles.site_id,
        row_number() over (
          partition by field_definitions.id
          order by entries.position
        ) as nth
      from jsonb_array_elements(field_values)
        with ordinality as entries (value, position)
      join public.articles
        on articles.id = set_article_field_values.article_id
      join public.field_definitions
        on field_definitions.id = (entries.value->>'field_id')::uuid
        and field_definitions.site_id = articles.site_id
      where coalesce(entries.value->>'text', '') <> ''
    ) as picked
    left join public.articles as targets
      on targets.id = picked.target_article_id
      and targets.site_id = picked.site_id
      and targets.id <> set_article_field_values.article_id
    where picked.multiple or picked.nth = 1;

  select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'field_id', article_field_values.field_id,
          'text', article_field_values.text,
          'href', article_field_values.href,
          'target_article_id', article_field_values.target_article_id
        )
        order by article_field_values.position
      ),
      '[]'::jsonb
    )
    into result
    from public.article_field_values
    where article_field_values.article_id = set_article_field_values.article_id;

  return result;
end;
$$;

revoke execute on function public.set_article_field_values(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.set_article_field_values(uuid, jsonb)
  to service_role;

-- Moves a field definition to the trash in one transaction, see
-- db/002_trash.sql. Its values are deleted along with it, so they're kept in
-- the trashed data as values, for a restore to put back. Returns false if
-- there was no field definition with that id.
create or replace function public.trash_field_definition(field_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  trashed jsonb;
begin
  select to_jsonb(field_definitions) || jsonb_build_object(
      'values', coalesce((
        select jsonb_agg(
            jsonb_build_object(
              'article_id', article_field_values.article_id,
              'position', article_field_values.position,
              'text', article_field_values.text,
              'href', article_field_values.href,
              'target_article_id', article_field_values.target_article_id
            )
          )
          from public.article_field_values
          where article_field_values.field_id = field_definitions.id
      ), '[]'::jsonb)
    )
    into trashed
    from public.field_definitions
    where field_definitions.id = trash_field_definition.field_id;

  if trashed is null then
    return false;
  end if;

  delete from public.field_definitions
    where field_definitions.id = trash_field_definition.field_id;

  insert into public.trash (document_type, document_id, site_id, data)
    values (
      'field_definition',
      trash_field_definition.field_id,
      trashed->>'site_id',
      trashed
    );

  return true;
end;
$$;

revoke execute on function public.trash_field_definition(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_field_definition(uuid)
  to service_role;

-- Replaces the function from db/005_sites.sql, so the article's field values
-- are kept in the trashed data as field_values, since they're deleted along
-- with it. Links to the article from other articles' field values are
-- cleared, which keeps their text.
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
      ), '[]'::jsonb),
      'field_values', coalesce((
        select jsonb_agg(
            jsonb_build_object(
              'field_id', article_field_values.field_id,
              'text', article_field_values.text,
              'href', article_field_values.href,
              'target_article_id', article_field_values.target_article_id
            )
            order by article_field_values.position
          )
          from public.article_field_values
          where article_field_values.article_id = articles.id
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
