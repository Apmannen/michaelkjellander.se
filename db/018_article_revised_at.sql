-- An optional time when an article was last revised, set by hand when its
-- content has been updated after it was published, see
-- apps/cms/src/lib/articles.ts. Null means never revised. trash_article keeps
-- it in the trashed data through to_jsonb(articles).
alter table public.articles
  add column if not exists revised_at timestamptz;

alter table public.articles
  drop constraint if exists articles_revised_after_published;

alter table public.articles
  add constraint articles_revised_after_published
    check (revised_at is null or revised_at >= published_at);

-- What articles are sorted by: the latest of the publication and revision
-- times. PostgREST can't order by an expression, so it's stored as a column.
alter table public.articles
  add column if not exists sort_date timestamptz
    generated always as (coalesce(revised_at, published_at)) stored;

create index if not exists articles_site_sort_date_idx
  on public.articles (site_id, sort_date desc);
