-- Intro: a short tagline shown under the article title. Empty means no intro.
alter table public.articles
  add column if not exists intro text not null default '';
