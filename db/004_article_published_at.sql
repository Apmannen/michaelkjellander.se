-- Publication time, set manually in the cms. Existing articles get their
-- creation time.
alter table public.articles
  add column if not exists published_at timestamptz;

update public.articles
  set published_at = created_at
  where published_at is null;

alter table public.articles
  alter column published_at set default now(),
  alter column published_at set not null;
