-- Dynamic fields on tags, see db/007_fields.sql. A site's field definitions
-- can be added to its tags as well as to its articles, and a tag's link
-- fields can link to the site's articles.
create table if not exists public.tag_field_values (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null,
  field_id uuid not null,
  position int not null default 0,
  text text not null,
  -- Only for link fields, and at most one of them. Neither means a link
  -- field's text isn't linked.
  href text,
  -- Cleared if the linked article is deleted, which keeps the text.
  target_article_id uuid,

  constraint tag_field_values_tag_id_fkey
    foreign key (tag_id) references public.tags (id) on delete cascade,
  constraint tag_field_values_field_id_fkey
    foreign key (field_id) references public.field_definitions (id)
      on delete cascade,
  constraint tag_field_values_target_article_id_fkey
    foreign key (target_article_id) references public.articles (id)
      on delete set null,
  constraint tag_field_values_one_link
    check (href is null or target_article_id is null)
);

create index if not exists tag_field_values_tag_idx
  on public.tag_field_values (tag_id, position);
create index if not exists tag_field_values_field_idx
  on public.tag_field_values (field_id);
create index if not exists tag_field_values_target_idx
  on public.tag_field_values (target_article_id);

-- RLS on: the cms uses the service role key (bypasses RLS), the site uses the
-- anon key. Tags have no published state, so all of their values are
-- readable. A linked article is only readable when it's published, so the
-- site gets null for one that isn't and can show the text without a link.
alter table public.tag_field_values enable row level security;

drop policy if exists "Tag field values are readable by everyone"
  on public.tag_field_values;
create policy "Tag field values are readable by everyone"
  on public.tag_field_values for select
  to anon
  using (true);

-- Replaces a tag's field values in one transaction, in the given order. Same
-- format and rules as set_article_field_values in db/007_fields.sql, except
-- that any article of the tag's site may be linked to. Returns the values
-- that were set, in the same format.
create or replace function public.set_tag_field_values(
  tag_id uuid,
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
  delete from public.tag_field_values
    where tag_field_values.tag_id = set_tag_field_values.tag_id;

  insert into public.tag_field_values
    (tag_id, field_id, position, text, href, target_article_id)
    select
      set_tag_field_values.tag_id,
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
        tags.site_id,
        row_number() over (
          partition by field_definitions.id
          order by entries.position
        ) as nth
      from jsonb_array_elements(field_values)
        with ordinality as entries (value, position)
      join public.tags
        on tags.id = set_tag_field_values.tag_id
      join public.field_definitions
        on field_definitions.id = (entries.value->>'field_id')::uuid
        and field_definitions.site_id = tags.site_id
      where coalesce(entries.value->>'text', '') <> ''
    ) as picked
    left join public.articles as targets
      on targets.id = picked.target_article_id
      and targets.site_id = picked.site_id
    where picked.multiple or picked.nth = 1;

  select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'field_id', tag_field_values.field_id,
          'text', tag_field_values.text,
          'href', tag_field_values.href,
          'target_article_id', tag_field_values.target_article_id
        )
        order by tag_field_values.position
      ),
      '[]'::jsonb
    )
    into result
    from public.tag_field_values
    where tag_field_values.tag_id = set_tag_field_values.tag_id;

  return result;
end;
$$;

revoke execute on function public.set_tag_field_values(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.set_tag_field_values(uuid, jsonb)
  to service_role;

-- Replaces the function from db/007_fields.sql, so the field's values on tags
-- are kept in the trashed data as tag_values, next to the articles' values.
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
      ), '[]'::jsonb),
      'tag_values', coalesce((
        select jsonb_agg(
            jsonb_build_object(
              'tag_id', tag_field_values.tag_id,
              'position', tag_field_values.position,
              'text', tag_field_values.text,
              'href', tag_field_values.href,
              'target_article_id', tag_field_values.target_article_id
            )
          )
          from public.tag_field_values
          where tag_field_values.field_id = field_definitions.id
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

-- Replaces the function from db/005_sites.sql, so the tag's field values are
-- kept in the trashed data as field_values, since they're deleted along with
-- it.
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
      ), '[]'::jsonb),
      'field_values', coalesce((
        select jsonb_agg(
            jsonb_build_object(
              'field_id', tag_field_values.field_id,
              'text', tag_field_values.text,
              'href', tag_field_values.href,
              'target_article_id', tag_field_values.target_article_id
            )
            order by tag_field_values.position
          )
          from public.tag_field_values
          where tag_field_values.tag_id = tags.id
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
