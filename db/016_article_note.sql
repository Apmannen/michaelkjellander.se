-- An optional special note shown at the top of an article, e.g. "Obs! Recensionen
-- är uppdelad i två delar...", see apps/cms/src/lib/articles.ts. Plain text that
-- may contain line breaks. Null means no note. trash_article keeps it in the
-- trashed data through to_jsonb(articles).
alter table public.articles
  add column if not exists note text;

alter table public.articles
  drop constraint if exists articles_note_not_blank;

alter table public.articles
  add constraint articles_note_not_blank
    check (note is null or btrim(note) <> '');
