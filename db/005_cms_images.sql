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

-- Images are stored as objects, see apps/cms/src/lib/images.ts:
--   { "path": "<uuid>.jpg", "alt": "...", "width": 1200, "height": 800 }
-- path is relative to the cms-images bucket.
--
-- The article's cover image, shown above the body.
alter table public.articles
  add column if not exists cover_image jsonb;

alter table public.articles
  add constraint articles_cover_image_is_object
  check (cover_image is null or jsonb_typeof(cover_image) = 'object');

-- Images in the body are blocks of their own, see apps/cms/src/lib/body.ts:
--   { "id": "...", "type": "image", "path": "...", "alt": "...",
--     "width": 1200, "height": 800, "caption": "..." }
