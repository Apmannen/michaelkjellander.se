-- An optional call to action button shown under the intro, see
-- apps/cms/src/lib/articles.ts:
--   { "icon": "PiGameController", "text": "Spela nu", "href": "https://..." }
-- icon may be left out. Null means no button.
alter table public.articles
  add column if not exists cta jsonb;

alter table public.articles
  drop constraint if exists articles_cta_is_object;

alter table public.articles
  add constraint articles_cta_is_object
    check (cta is null or jsonb_typeof(cta) = 'object');
