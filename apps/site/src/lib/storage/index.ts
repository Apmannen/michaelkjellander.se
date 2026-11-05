import { db } from '../db';

const getPublicUrl = (path: string) => {
  return db.supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
};

export const storage = {
  getPublicUrl,
};
