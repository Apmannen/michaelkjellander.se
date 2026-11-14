'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  type NewSiteInput,
  type Site,
  type SiteInput,
  validateSite,
  validateSiteId,
} from '@/lib/sites';

export type SaveSiteResult =
  | { ok: true; site: Site }
  | { ok: false; error: string };

const parseInput = (raw: SiteInput): SiteInput => ({
  // The name is shown on one line, so line breaks become spaces.
  name: String(raw.name ?? '')
    .replace(/\s+/g, ' ')
    .trim(),
  // Without a trailing slash, so it reads the same however it was typed.
  url: String(raw.url ?? '')
    .trim()
    .replace(/\/+$/, ''),
  api_secret: String(raw.api_secret ?? '').trim(),
});

export async function createSite(
  raw: NewSiteInput,
): Promise<{ ok: false; error: string }> {
  await requireUser();

  const input: NewSiteInput = {
    ...parseInput(raw),
    id: String(raw.id ?? '').trim(),
  };

  const validationError = validateSiteId(input.id) ?? validateSite(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { error } = await db.createSite(input);

  if (error) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'Det finns redan en sajt med det ID:t.' };
    }
    console.error('createSite failed', error);
    return { ok: false, error: 'Kunde inte skapa sajten.' };
  }

  // Every page has the site menu.
  revalidatePath('/', 'layout');
  redirect(`/${input.id}`);
}

export async function updateSite(
  id: string,
  raw: SiteInput,
): Promise<SaveSiteResult> {
  await requireUser();

  const input = parseInput(raw);

  const validationError = validateSite(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { data, error } = await db.updateSite(id, input);

  if (error) {
    console.error('updateSite failed', error);
    return { ok: false, error: 'Kunde inte spara sajten.' };
  }

  revalidatePath('/', 'layout');

  return { ok: true, site: data };
}
