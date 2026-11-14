-- A tag's name in singular, e.g. "Recension" for "Spelrecensioner", see
-- apps/cms/src/lib/tags.ts. Empty means none. trash_tag keeps it in the
-- trashed data through to_jsonb(tags).
alter table public.tags
  add column if not exists singular_name text not null default '';
