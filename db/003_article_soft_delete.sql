-- Soft delete: deleted articles keep their row but get deleted_at set.
alter table public.articles
  add column if not exists deleted_at timestamptz;

-- The site (anon) may not read deleted articles. The cms uses the service role
-- key, which bypasses RLS, so it filters on deleted_at itself.
drop policy if exists "Published articles are readable by everyone"
  on public.articles;

create policy "Published articles are readable by everyone"
  on public.articles for select
  to anon
  using (published = true and deleted_at is null);

-- Only live articles need unique slugs, so a deleted article's slug can be
-- reused.
alter table public.articles
  drop constraint if exists articles_slug_key;

create unique index if not exists articles_slug_unique
  on public.articles (slug)
  where deleted_at is null;
