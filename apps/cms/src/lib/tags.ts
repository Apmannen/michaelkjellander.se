import type { Body, BodyFeature } from '@/lib/body';
import { validateSlug } from '@/lib/slug';

export type Tag = {
  id: string;
  name: string;
  // E.g. "Recension" for "Spelrecensioner". Empty means none.
  singular_name: string;
  slug: string;
  description: Body;
  // In the order they were picked. Empty for a top-level tag.
  parent_ids: string[];
  created_at: string;
  updated_at: string;
};

export type TagInput = Pick<
  Tag,
  'name' | 'singular_name' | 'slug' | 'description' | 'parent_ids'
>;

// What a tag's description may contain besides plain paragraphs.
export const TAG_DESCRIPTION_FEATURES: readonly BodyFeature[] = [
  'link',
  'list',
];

// Keeps the first of each id and drops anything that isn't a string.
export const parseIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
    : [];

// The ids of the tag and all tags below it, which therefore can't be its
// parents.
export const findDescendantIds = (tags: Tag[], id: string): Set<string> => {
  const result = new Set([id]);
  let added = true;
  while (added) {
    added = false;
    for (const tag of tags) {
      if (
        !result.has(tag.id) &&
        tag.parent_ids.some((parentId) => result.has(parentId))
      ) {
        result.add(tag.id);
        added = true;
      }
    }
  }
  return result;
};

export const validateTag = (input: TagInput): string | undefined => {
  if (!input.name.trim()) {
    return 'Namn måste anges.';
  }
  return validateSlug(input.slug);
};
