import { IconName } from '@/components/standard/NamedIcon/types';
import { Database } from './supabase.types';

type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type IconPayload = { type: 'icon'; name: IconName };
export type LinkPayload = { type: 'link'; href: string };

export type BodyMarkPayload = {
  start: number;
  end: number;
} & (LinkPayload | IconPayload | { type: 'bold' | 'underline' });
export type ArticleBodyPartPayload = {
  type: 'paragraph' | 'heading' | 'quote' | 'divider' | 'list';
  text?: string;
  author?: string;
  marks?: BodyMarkPayload[];
  href?: string;
  items?: {
    icon?: IconPayload;
    text: string;
    marks: (BodyMarkPayload & { type: 'link' })[];
  }[];
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
