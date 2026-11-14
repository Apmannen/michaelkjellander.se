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
      `id, title, body, cover_image, intro, cta, slug,
      tags:article_tags!article_id(
        ...tags(slug)
      ),
      fields:article_field_values!article_id(
        text,
        field:field_definitions(key)
      )
    `,
    )
    .order('published_at', { ascending: false });

  if (slug) {
    query.eq('slug', slug);
  }

  const res = await query;

  //res.data?.at(0)?.tags.at(0).
  console.log('***D', JSON.stringify(res.data, null, 2));

  return (res.data as ArticlePayload[]) || [];
};

export const db = {
  articles,
};
