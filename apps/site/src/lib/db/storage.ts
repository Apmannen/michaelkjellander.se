import { supabase } from './supabase';

const getPublicUrl = (path: string) => {
  return supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
};

export const storage = {
  getPublicUrl,
};
