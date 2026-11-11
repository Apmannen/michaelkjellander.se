import { cacheLife, cacheTag } from 'next/cache';
import { db } from '.';
import { ArticlePayload } from './payload.types';

const latest = async (): Promise<ArticlePayload[]> => {
  'use cache';
  cacheTag('articles');
  cacheLife('hours');

  const res = await db.supabase
    .from('articles')
    .select('id, title, body, cover_image, intro')
    .order('published_at', { ascending: false });

  return (res.data as ArticlePayload[]) || [];
};

export const dbArticles = {
  latest,
};
