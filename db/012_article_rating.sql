-- An optional rating of an article, e.g. of a reviewed game, from 1 to 10, see
-- apps/cms/src/lib/articles.ts. Null means no rating. trash_article keeps it in
-- the trashed data through to_jsonb(articles).
alter table public.articles
  add column if not exists rating smallint;

alter table public.articles
  drop constraint if exists articles_rating_range;

alter table public.articles
  add constraint articles_rating_range
    check (rating is null or rating between 1 and 10);
