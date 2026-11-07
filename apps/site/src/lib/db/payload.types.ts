import { Database } from './supabase.types';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type BodyMarkPayload = {
  start: number;
  end: number;
  href?: string;
  type: 'link' | 'bold' | 'underline';
};
export type ArticleBodyPartPayload = {
  type: 'paragraph' | 'quote' | 'divider';
  text?: string;
  author?: string;
  marks?: BodyMarkPayload[];
  href?: string;
};

export type ArticlePayload = Prettify<
  Omit<
    Database['public']['Tables']['articles']['Row'],
    'body' | 'cover_image'
  > & {
    body: ArticleBodyPartPayload[];
    cover_image: { path: string } | null;
  }
>;
