'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  type Article,
  type ArticleInput,
  parseCallToAction,
  validateArticle,
} from '@/lib/articles';
import { parseBody } from '@/lib/body';
import { db } from '@/lib/db';
import { parseFieldValues, validateFieldValues } from '@/lib/fields';
import { parseImage } from '@/lib/images';
import { parseIds } from '@/lib/tags';

export type SaveArticleResult =
  | { ok: true; article: Article }
  | { ok: false; error: string };

// TODO: verify authentication here once the cms has login.
export async function saveArticle(
  siteId: string,
  id: string | null,
  raw: ArticleInput,
): Promise<SaveArticleResult> {
  const fieldDefinitions = await db.listFieldDefinitions(siteId);
  const input: ArticleInput = {
    title: String(raw.title ?? '').trim(),
    slug: String(raw.slug ?? '').trim(),
    // The intro is a one-line tagline, so line breaks become spaces.
    intro: String(raw.intro ?? '')
      .replace(/\s*[\r\n]+\s*/g, ' ')
      .trim(),
    cta: parseCallToAction(raw.cta),
    published: raw.published === true,
    published_at: String(raw.published_at ?? ''),
    cover_image: parseImage(raw.cover_image),
    body: parseBody(raw.body),
    tag_ids: parseIds(raw.tag_ids),
    field_values: parseFieldValues(raw.field_values, fieldDefinitions),
  };

  const validationError =
    validateArticle(input) ??
    validateFieldValues(input.field_values, fieldDefinitions);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  input.published_at = new Date(input.published_at).toISOString();

  const { data, error } = id
    ? await db.updateArticle(siteId, id, input)
    : await db.createArticle(siteId, input);

  if (error) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'Det finns redan en artikel med den sluggen.' };
    }
    console.error('saveArticle failed', error);
    return { ok: false, error: 'Kunde inte spara artikeln.' };
  }

  revalidatePath(`/${siteId}/articles`, 'layout');

  if (!id) {
    redirect(`/${siteId}/articles/${data.id}`);
  }

  return { ok: true, article: data };
}

// TODO: verify authentication here once the cms has login.
export async function deleteArticle(
  siteId: string,
  id: string,
): Promise<{ ok: false; error: string }> {
  const { error } = await db.deleteArticle(id);

  if (error) {
    console.error('deleteArticle failed', error);
    return { ok: false, error: 'Kunde inte ta bort artikeln.' };
  }

  revalidatePath(`/${siteId}/articles`, 'layout');
  redirect(`/${siteId}/articles`);
}
