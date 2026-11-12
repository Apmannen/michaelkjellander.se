import {
  type Body,
  isValidHref,
  isValidIconName,
  normalizeHref,
} from '@/lib/body';
import type { Image } from '@/lib/images';
import { validateSlug } from '@/lib/slug';

// A button shown under the intro, e.g. "Spela nu" linking to a game.
export type CallToAction = {
  // A react-icons icon shown before the text, e.g. PiGithubLogo.
  icon?: string;
  text: string;
  href: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  intro: string;
  cta?: CallToAction;
  published: boolean;
  published_at: string;
  cover_image?: Image;
  body: Body;
  // In the order they were picked.
  tag_ids: string[];
  created_at: string;
  updated_at: string;
};

export type ArticleInput = Pick<
  Article,
  | 'title'
  | 'slug'
  | 'intro'
  | 'cta'
  | 'published'
  | 'published_at'
  | 'cover_image'
  | 'body'
  | 'tag_ids'
>;

// Undefined if every field is empty, so a cleared button is removed. A button
// with missing fields is kept so validateArticle can point them out.
export const parseCallToAction = (value: unknown): CallToAction | undefined => {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const { icon, text, href } = value as Record<string, unknown>;
  const cta: CallToAction = {
    ...(typeof icon === 'string' && isValidIconName(icon) ? { icon } : {}),
    text: typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '',
    href: typeof href === 'string' ? normalizeHref(href) : '',
  };
  if (!cta.icon && !cta.text && !cta.href) {
    return undefined;
  }
  return cta;
};

export const validateArticle = (input: ArticleInput): string | undefined => {
  if (!input.title.trim()) {
    return 'Rubrik måste anges.';
  }
  const slugError = validateSlug(input.slug);
  if (slugError) {
    return slugError;
  }
  if (Number.isNaN(Date.parse(input.published_at))) {
    return 'Publiceringstid måste anges.';
  }
  if (input.cta) {
    if (!input.cta.text) {
      return 'Knappen behöver en text.';
    }
    if (!input.cta.href) {
      return 'Knappen behöver en adress.';
    }
    if (!isValidHref(input.cta.href)) {
      return 'Knappens adress är ogiltig.';
    }
  }
  return undefined;
};
