import { Database } from './supabase.types';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type ArticleBodyPartPayload = {
  type: 'paragraph' | 'quote';
  text?: string;
  author?: string;
  marks?: {
    start: number;
    end: number;
    href?: string;
    type: 'link' | 'bold' | 'underline';
  }[];
};

export type ArticlePayload = Prettify<
  Omit<Database['public']['Tables']['articles']['Row'], 'body'> & {
    body: ArticleBodyPartPayload[];
  }
>;
