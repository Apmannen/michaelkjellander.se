'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { parseBody } from '@/lib/body';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  TAG_DESCRIPTION_FEATURES,
  type Tag,
  type TagInput,
  findDescendantIds,
  parseIds,
  validateTag,
} from '@/lib/tags';

export type SaveTagResult =
  | { ok: true; tag: Tag }
  | { ok: false; error: string };

const CYCLE_ERROR =
  'En tagg kan inte ha sig själv eller någon av sina undertaggar som förälder.';

// The article editors list the tags, so they're refreshed too.
const revalidate = (siteId: string) => {
  revalidatePath(`/${siteId}/tags`, 'layout');
  revalidatePath(`/${siteId}/articles`, 'layout');
};

export async function saveTag(
  siteId: string,
  id: string | undefined,
  raw: TagInput,
): Promise<SaveTagResult> {
  await requireUser();

  const input: TagInput = {
    // The names are shown on one line, so line breaks become spaces.
    name: String(raw.name ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
    singular_name: String(raw.singular_name ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
    slug: String(raw.slug ?? '').trim(),
    description: parseBody(raw.description, TAG_DESCRIPTION_FEATURES),
    parent_ids: parseIds(raw.parent_ids),
  };

  const validationError = validateTag(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Checked before saving, so the tag isn't saved without its parents. The
  // database checks it again when setting the parents.
  if (id) {
    const descendants = findDescendantIds(await db.listTags(siteId), id);
    if (input.parent_ids.some((parentId) => descendants.has(parentId))) {
      return { ok: false, error: CYCLE_ERROR };
    }
  }

  const { data, error } = id
    ? await db.updateTag(siteId, id, input)
    : await db.createTag(siteId, input);

  if (error) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'Det finns redan en tagg med den sluggen.' };
    }
    // 23514 = check_violation, raised by set_tag_parents.
    if (error.code === '23514') {
      return { ok: false, error: CYCLE_ERROR };
    }
    console.error('saveTag failed', error);
    return { ok: false, error: 'Kunde inte spara taggen.' };
  }

  revalidate(siteId);

  if (!id) {
    redirect(`/${siteId}/tags/${data.id}`);
  }

  return { ok: true, tag: data };
}

export async function deleteTag(
  siteId: string,
  id: string,
): Promise<{ ok: false; error: string }> {
  await requireUser();

  const { error } = await db.deleteTag(id);

  if (error) {
    console.error('deleteTag failed', error);
    return { ok: false, error: 'Kunde inte ta bort taggen.' };
  }

  revalidate(siteId);
  redirect(`/${siteId}/tags`);
}
