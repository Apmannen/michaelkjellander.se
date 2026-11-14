-- A tag's type, e.g. "Genre" or "Plattform", in free text, see
-- apps/cms/src/lib/tags.ts. Empty means none. trash_tag keeps it in the
-- trashed data through to_jsonb(tags).
alter table public.tags
  add column if not exists type text not null default '';
