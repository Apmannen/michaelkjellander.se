import { Database } from './supabase.types';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type ArticlePayload = Prettify<
  Omit<Database['public']['Tables']['articles']['Row'], 'body'> & {
    body: { type: 'paragraph' | 'quote'; text?: string; author?: string }[];
  }
>;
