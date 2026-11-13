import { cacheLife, cacheTag } from 'next/cache';
import { db } from '.';
import { ArticlePayload } from './payload.types';

const latest = async (): Promise<ArticlePayload[]> => {
  'use cache';
  cacheTag('articles');
  cacheLife('hours');

  const res = await db.supabase
    .from('articles')
    .select(
      `id, title, body, cover_image, intro, cta,
      fields:article_field_values!article_id(
        text,
        field:field_definitions(key)
      )
    `,
    )
    .order('published_at', { ascending: false });

  return (res.data as ArticlePayload[]) || [];
};

export const dbArticles = {
  latest,
};

/* .select(`
  id, title, body,
  fields:article_field_values!article_id(
    position, text, href,
    field:field_definitions(key, label, type),
    target:articles!target_article_id(slug, title)
  )
`)
 */
