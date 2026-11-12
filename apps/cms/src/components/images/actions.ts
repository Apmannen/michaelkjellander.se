'use server';

import { db } from '@/lib/db';
import { MAX_IMAGE_SIZE, detectImageFormat } from '@/lib/images';

export type UploadImageResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

// TODO: verify authentication here once the cms has login.
export async function uploadImage(
  formData: FormData,
): Promise<UploadImageResult> {
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

  const path = `${crypto.randomUUID()}.${format.extension}`;
  const { error } = await db.uploadImage(path, data, format.contentType);

  if (error) {
    console.error('uploadImage failed', error);
    return { ok: false, error: 'Kunde inte ladda upp bilden.' };
  }

  return { ok: true, path };
}
