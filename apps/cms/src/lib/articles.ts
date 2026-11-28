import {
  type Body,
  isValidHref,
  isValidIconName,
  normalizeHref,
} from '@/lib/body';
import type { FieldValue } from '@/lib/fields';
import type { Image } from '@/lib/images';
import { isValidRating, RATING_MAX, RATING_MIN } from '@/lib/rating';
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
  // A whole number from RATING_MIN to RATING_MAX, e.g. for a review.
  rating?: number;
  // Shown in the same box as the rating, also when there is no rating. Lines
  // of plain text, see lib/rating.ts.
  pros?: string[];
  cons?: string[];
  // A special note shown at the top of the article, e.g. that a review was
  // written on two occasions. Plain text that may contain line breaks.
  note?: string;
  published: boolean;
  published_at: string;
  // Set by hand when the content has been updated after it was published.
  // Articles are sorted by this, or by published_at if it isn't set. Not the
  // same as updated_at, which changes on every save.
  revised_at?: string;
  cover_image?: Image;
  body: Body;
  // In the order they were picked.
  tag_ids: string[];
  // Values of the site's dynamic fields, see lib/fields.ts. In order, and the
  // values of a field are next to each other.
  field_values: FieldValue[];
  created_at: string;
  updated_at: string;
};

// What other documents need to know about an article, e.g. to link to it.
export type ArticleSummary = Pick<Article, 'id' | 'title' | 'published'>;

export type ArticleInput = Pick<
  Article,
  | 'title'
  | 'slug'
  | 'intro'
  | 'cta'
  | 'rating'
  | 'pros'
  | 'cons'
  | 'note'
  | 'published'
  | 'published_at'
  | 'revised_at'
  | 'cover_image'
  | 'body'
  | 'tag_ids'
  | 'field_values'
>;

// Undefined if the note is empty. Line breaks are kept, but normalized to \n
// and with surrounding whitespace removed from each line.
export const parseNote = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const note = value
    .split(/\r\n?|\n/)
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return note || undefined;
};

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
  if (input.revised_at !== undefined) {
    const revisedAt = Date.parse(input.revised_at);
    if (Number.isNaN(revisedAt)) {
      return 'Senast reviderad är ogiltig.';
    }
    if (revisedAt < Date.parse(input.published_at)) {
      return 'Senast reviderad kan inte vara före publiceringstiden.';
    }
  }
  if (input.rating !== undefined && !isValidRating(input.rating)) {
    return `Betyget måste vara ett heltal från ${RATING_MIN} till ${RATING_MAX}.`;
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
