-- Body is an ordered array of blocks, see apps/cms/src/lib/body.ts:
--   { "id": "...", "type": "paragraph", "text": "..." }   (\n = line break)
--   { "id": "...", "type": "quote", "text": "...", "author": "..." }
alter table public.articles
  add column if not exists body jsonb not null default '[]'::jsonb;

alter table public.articles
  add constraint articles_body_is_array check (jsonb_typeof(body) = 'array');
