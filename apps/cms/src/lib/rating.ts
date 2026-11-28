// A rating together with pros and cons, e.g. of a reviewed game. Used both
// for an article's own rating and for rating blocks in a body, e.g. to keep an
// original rating after the article's rating has changed. Every part is
// optional, so there can be pros and cons without a rating.
export type Rating = {
  // A whole number from RATING_MIN to RATING_MAX.
  rating?: number;
  // Lines of plain text, in order. Left out when there are none.
  pros?: string[];
  cons?: string[];
};

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export const RATINGS = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index,
);

export const isValidRating = (rating: number) =>
  Number.isInteger(rating) && rating >= RATING_MIN && rating <= RATING_MAX;

// Undefined if no rating is set. Anything else that isn't a whole number is
// kept as NaN so validateArticle can point it out.
export const parseRating = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const rating = Number(value);
  return Number.isInteger(rating) ? rating : Number.NaN;
};

// Pros or cons: whitespace within a line is collapsed, and empty lines are
// dropped. Undefined if no lines remain.
export const parseLines = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const lines = value.flatMap((line) => {
    if (typeof line !== 'string') {
      return [];
    }
    const text = line.replace(/\s+/g, ' ').trim();
    return text ? [text] : [];
  });
  return lines.length ? lines : undefined;
};

export const hasRatingContent = ({ rating, pros, cons }: Rating) =>
  rating !== undefined || !!pros?.length || !!cons?.length;
