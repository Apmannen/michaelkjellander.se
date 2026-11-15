import { IconName } from '@/components/standard/NamedIcon/types';
import { Database } from './supabase.types';

//type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type LinkPayload = { type: 'link'; href: string };
export type CallToActionPayload = {
  icon?: IconName;
  text: string;
  href: string;
};

export type TagPayload = Pick<
  Database['public']['Tables']['tags']['Insert'],
  'slug' | 'singular_name' | 'name' | 'id'
> & { type?: 'game_platform'; tag_parents?: Omit<TagPayload, 'tag_parents'>[] };

export type BodyMarkPayload = {
  start: number;
  end: number;
} & (
  | LinkPayload
  | { type: 'icon'; name: IconName }
  | { type: 'bold' | 'italic' }
);
export type ArticleBodyPartPayload = {
  type: 'paragraph' | 'heading' | 'quote' | 'divider' | 'list';
  text?: string;
  author?: string;
  marks?: BodyMarkPayload[];
  href?: string;
  items?: {
    icon?: IconName;
    text: string;
    marks: (BodyMarkPayload & { type: 'link' })[];
  }[];
};

export type ArticlePayload = Pick<
  Database['public']['Tables']['articles']['Row'],
  'id' | 'title' | 'intro' | 'slug' | 'published_at' | 'rating'
> & {
  body: ArticleBodyPartPayload[];
  cover_image: { path: string } | null;
  cta: CallToActionPayload;
  fields?: DynamicFieldPayload[];
  tags: TagPayload[];
};

export type DynamicFieldPayload = {
  href: string | null;
  text: string;
  field: { key: 'dev_tool' | 'dev_years' | 'play_also' | 'play_rather' };
  target_article?: {
    slug: string;
    tags: Pick<TagPayload, 'slug'>[];
  };
};
