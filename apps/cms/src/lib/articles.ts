export type Article = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleInput = Pick<Article, 'title' | 'slug' | 'published'>;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // å, ä, ö, é ... -> a, a, o, e
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const validateArticle = (input: ArticleInput): string | null => {
  if (!input.title.trim()) return 'Rubrik måste anges.';
  if (!input.slug) return 'Slug måste anges.';
  if (!SLUG_PATTERN.test(input.slug)) {
    return 'Slug får bara innehålla a–z, 0–9 och bindestreck.';
  }
  return null;
};
