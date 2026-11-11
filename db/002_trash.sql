-- Trash: deleted documents are moved here as JSON, so the live tables only
-- hold live documents. Shared by all document types.
create table if not exists public.trash (
  id uuid primary key default gen_random_uuid(),
  -- What kind of document this was, e.g. 'article'.
  document_type text not null,
  -- The document's id in its own table, kept so it can be restored.
  document_id uuid not null,
  -- The full deleted row, as returned by to_jsonb(row).
  data jsonb not null,
  deleted_at timestamptz not null default now(),

  constraint trash_data_is_object check (jsonb_typeof(data) = 'object')
);

create index if not exists trash_document_idx
  on public.trash (document_type, document_id);

-- RLS on without policies: only the cms (service role) may touch the trash.
alter table public.trash enable row level security;

-- Moves an article to the trash in one transaction. Returns false if there was
-- no article with that id.
create or replace function public.trash_article(article_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with deleted as (
    delete from public.articles
      where id = article_id
      returning *
  ), inserted as (
    insert into public.trash (document_type, document_id, data)
      select 'article', deleted.id, to_jsonb(deleted)
      from deleted
      returning 1
  )
  select exists (select 1 from inserted);
$$;

revoke execute on function public.trash_article(uuid)
  from public, anon, authenticated;
grant execute on function public.trash_article(uuid) to service_role;
