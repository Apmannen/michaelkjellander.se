import { db } from '.';

const latest = async () => {
  //TODO: move
  const res = await db.supabase
    .from('articles')
    .select('id, title')
    .order('created_at', { ascending: false });

  console.log('***res', res.data);

  //return [];
};

export const dbArticles = {
  latest,
};
