import { IconName } from '@/components/standard/NamedIcon/types';
import { Database } from './supabase.types';

//type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type LinkPayload = { type: 'link'; href: string };
export type CallToActionPayload = {
  icon?: IconName;
  text: string;
  href: string;
};

export type BodyMarkPayload = {
  start: number;
  end: number;
} & (
  | LinkPayload
  | { type: 'icon'; name: IconName }
  | { type: 'bold' | 'underline' }
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
  'id' | 'title' | 'intro'
> & {
  body: ArticleBodyPartPayload[];
  cover_image: { path: string } | null;
  cta: CallToActionPayload;
  fields?: DynamicFieldPayload[];
};

export type DynamicFieldPayload = {
  //href: string | null;
  text: string;
  field: { key: string; };
};

/* {
    href: null,
    text: 'Unity',
    field: { key: 'dev_tool', type: 'text', label: 'Utvecklat i' },
    target: null,
    position: 1
  } */
