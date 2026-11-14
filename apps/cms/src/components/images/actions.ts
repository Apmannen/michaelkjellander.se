'use server';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MAX_IMAGE_SIZE, detectImageFormat } from '@/lib/images';
import { validateSiteId } from '@/lib/sites';

export type UploadImageResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export async function uploadImage(
  siteId: string,
  formData: FormData,
): Promise<UploadImageResult> {
  await requireUser();

  // The site id becomes part of the path, so it's checked first.
  if (validateSiteId(siteId)) {
    return { ok: false, error: 'Okänd sajt.' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, error: 'Ingen bild vald.' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: 'Bilden får vara högst 1 MB.' };
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const format = detectImageFormat(data);
  if (!format) {
    return {
      ok: false,
      error: 'Bilden måste vara JPEG, PNG, WebP eller GIF.',
    };
  }

  const path = `${siteId}/${crypto.randomUUID()}.${format.extension}`;
  const { error } = await db.uploadImage(path, data, format.contentType);

  if (error) {
    console.error('uploadImage failed', error);
    return { ok: false, error: 'Kunde inte ladda upp bilden.' };
  }

  return { ok: true, path };
}
