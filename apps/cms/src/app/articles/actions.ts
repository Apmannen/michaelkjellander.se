'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type Article, type ArticleInput, validateArticle } from '@/lib/articles';
import { parseBody } from '@/lib/body';
import { db } from '@/lib/db';

export type SaveArticleResult =
  | { ok: true; article: Article }
  | { ok: false; error: string };

// TODO: verify authentication here once the cms has login.
export async function saveArticle(
  id: string | null,
  raw: ArticleInput,
): Promise<SaveArticleResult> {
  const input: ArticleInput = {
    title: String(raw.title ?? '').trim(),
    slug: String(raw.slug ?? '').trim(),
    published: raw.published === true,
    body: parseBody(raw.body),
  };

  const validationError = validateArticle(input);
  if (validationError) return { ok: false, error: validationError };

  const { data, error } = id
    ? await db.updateArticle(id, input)
    : await db.createArticle(input);

  if (error) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'Det finns redan en artikel med den sluggen.' };
    }
    console.error('saveArticle failed', error);
    return { ok: false, error: 'Kunde inte spara artikeln.' };
  }

  revalidatePath('/articles', 'layout');

  if (!id) {
    redirect(`/articles/${data.id}`);
  }

  return { ok: true, article: data };
}

// TODO: verify authentication here once the cms has login.
export async function deleteArticle(
  id: string,
): Promise<{ ok: false; error: string }> {
  const { error } = await db.deleteArticle(id);

  if (error) {
    console.error('deleteArticle failed', error);
    return { ok: false, error: 'Kunde inte ta bort artikeln.' };
  }

  revalidatePath('/articles', 'layout');
  redirect('/articles');
}
