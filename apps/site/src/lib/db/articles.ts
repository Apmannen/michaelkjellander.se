import { db } from '.';
import { ArticlePayload } from './payloadTypes';

const latest = async (): Promise<ArticlePayload[]> => {
  //TODO: move
  const res = await db.supabase
    .from('articles')
    .select('id, title')
    .order('created_at', { ascending: false });

  console.log('***res', res.data);

  return [];
};

export const dbArticles = {
  latest,
};
