create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS on: the cms uses the service role key (bypasses RLS),
-- the site uses the anon key and may only read published articles.
alter table public.articles enable row level security;

create policy "Published articles are readable by everyone"
  on public.articles for select
  to anon
  using (published = true);
