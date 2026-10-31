import { db } from '.';

const latest = async () => {
  const res = await db.supabase
    .from('articles')
    .select('id, title')
    .order('created_at', { ascending: false });

  return res.data || undefined;
};

export const dbArticles = {
  latest,
};
