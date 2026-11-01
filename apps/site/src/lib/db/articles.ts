import { cacheLife, cacheTag } from 'next/cache';
import { db } from '.';
import { ArticlePayload } from './payload.types';

const latest = async (): Promise<
  Pick<ArticlePayload, 'id' | 'title' | 'body'>[]
> => {
  'use cache';
  cacheTag('articles');
  cacheLife('hours');

  const res = await db.supabase
    .from('articles')
    .select('id, title, body')
    .order('created_at', { ascending: false });

  return (res.data as ArticlePayload[]) || [];
};

export const dbArticles = {
  latest,
};
