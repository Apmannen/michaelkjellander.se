// Shared by all document types that have a slug.
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // å, ä, ö, é ... -> a, a, o, e
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Undefined if the slug is valid.
export const validateSlug = (slug: string): string | undefined => {
  if (!slug) {
    return 'Slug måste anges.';
  }
  if (!SLUG_PATTERN.test(slug)) {
    return 'Slug får bara innehålla a–z, 0–9 och bindestreck.';
  }
  return undefined;
};
