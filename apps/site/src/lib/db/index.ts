import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { ArticlePayload } from './payload.types';
import { supabase } from './supabase';

const articles = async ({
  slug,
}: {
  slug?: string;
}): Promise<ArticlePayload[]> => {
  'use cache';
  cacheTag('articles');
  cacheLife('hours');

  const query = supabase
    .from('articles')
    .select(
      `id, title, body, cover_image, intro, cta, slug, published_at, rating,
      tags:article_tags!article_id(
        ...tags(slug, singular_name, name, type)
      ),
      fields:article_field_values!article_id(
        text,
        field:field_definitions(key)
      )
    `,
    )
    .order('published_at', { ascending: false })
    .order('position', { referencedTable: 'tags' });

  if (slug) {
    query.eq('slug', slug);
  }

  const res = await query;

  return (res.data as ArticlePayload[]) || [];
};

export const db = {
  articles,
};
