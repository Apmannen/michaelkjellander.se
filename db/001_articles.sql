create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  -- A short tagline shown under the article title. Empty means no intro.
  intro text not null default '',
  published boolean not null default false,
  -- Publication time, set manually in the cms.
  published_at timestamptz not null default now(),
  -- Images are stored as objects, see apps/cms/src/lib/images.ts:
  --   { "path": "<uuid>.jpg", "alt": "...", "width": 1200, "height": 800 }
  -- path is relative to the cms-images bucket. The cover image is shown above
  -- the body.
  cover_image jsonb,
  -- Body is an ordered array of blocks, see apps/cms/src/lib/body.ts, e.g.:
  --   { "id": "...", "type": "paragraph", "text": "..." }   (\n = line break)
  --   { "id": "...", "type": "quote", "text": "...", "author": "..." }
  --   { "id": "...", "type": "image", "path": "...", "alt": "...",
  --     "width": 1200, "height": 800, "caption": "..." }
  body jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint articles_cover_image_is_object
    check (cover_image is null or jsonb_typeof(cover_image) = 'object'),
  constraint articles_body_is_array
    check (jsonb_typeof(body) = 'array')
);

-- RLS on: the cms uses the service role key (bypasses RLS),
-- the site uses the anon key and may only read published articles.
alter table public.articles enable row level security;

create policy "Published articles are readable by everyone"
  on public.articles for select
  to anon
  using (published = true);

-- Images uploaded in the cms, shared by all document types. The bucket is
-- public, so the site can link straight to the files. Only the cms uploads,
-- with the service role key, which bypasses RLS, so no policies are needed.
insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-images',
  'cms-images',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
