import { Database } from './supabase.types';

export type ArticlePayload = Database['public']['Tables']['articles']['Row'];
