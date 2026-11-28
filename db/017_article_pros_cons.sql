-- Optional pros and cons of what an article reviews, shown together with the
-- rating, see apps/cms/src/lib/rating.ts. Each item is a trimmed line of plain
-- text. Null means none, so an empty array is never stored. trash_article keeps
-- them in the trashed data through to_jsonb(articles).
alter table public.articles
  add column if not exists pros text[];

alter table public.articles
  add column if not exists cons text[];

alter table public.articles
  drop constraint if exists articles_pros_valid;

alter table public.articles
  add constraint articles_pros_valid
    check (
      pros is null or (
        cardinality(pros) > 0
        and array_position(pros, null) is null
        and array_position(pros, '') is null
      )
    );

alter table public.articles
  drop constraint if exists articles_cons_valid;

alter table public.articles
  add constraint articles_cons_valid
    check (
      cons is null or (
        cardinality(cons) > 0
        and array_position(cons, null) is null
        and array_position(cons, '') is null
      )
    );
