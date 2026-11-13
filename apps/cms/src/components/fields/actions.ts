'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import {
  type FieldDefinition,
  type FieldDefinitionInput,
  isFieldType,
  validateFieldDefinition,
} from '@/lib/fields';

export type SaveFieldDefinitionResult =
  | { ok: true; field: FieldDefinition }
  | { ok: false; error: string };

// The article editors list the fields, so they're refreshed too.
const revalidate = (siteId: string) => {
  revalidatePath(`/${siteId}/fields`, 'layout');
  revalidatePath(`/${siteId}/articles`, 'layout');
};

// The type is only used when creating the field, since it can't be changed.
// TODO: verify authentication here once the cms has login.
export async function saveFieldDefinition(
  siteId: string,
  id: string | undefined,
  raw: FieldDefinitionInput,
): Promise<SaveFieldDefinitionResult> {
  const input: FieldDefinitionInput = {
    key: String(raw.key ?? '').trim(),
    // Shown on one line, so line breaks become spaces.
    label: String(raw.label ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
    type: isFieldType(raw.type) ? raw.type : 'text',
    multiple: raw.multiple === true,
    description: String(raw.description ?? '')
      .replace(/\s+/g, ' ')
      .trim(),
  };

  const validationError = validateFieldDefinition(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { data, error } = id
    ? await db.updateFieldDefinition(siteId, id, input)
    : await db.createFieldDefinition(siteId, input);

  if (error) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return { ok: false, error: 'Det finns redan ett fält med den nyckeln.' };
    }
    console.error('saveFieldDefinition failed', error);
    return { ok: false, error: 'Kunde inte spara fältet.' };
  }

  revalidate(siteId);

  if (!id) {
    redirect(`/${siteId}/fields/${data.id}`);
  }

  return { ok: true, field: data };
}

// TODO: verify authentication here once the cms has login.
export async function deleteFieldDefinition(
  siteId: string,
  id: string,
): Promise<{ ok: false; error: string }> {
  const { error } = await db.deleteFieldDefinition(id);

  if (error) {
    console.error('deleteFieldDefinition failed', error);
    return { ok: false, error: 'Kunde inte ta bort fältet.' };
  }

  revalidate(siteId);
  redirect(`/${siteId}/fields`);
}
