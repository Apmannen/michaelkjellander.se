'use client';

import { useParams } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

import {
  IMAGE_ACCEPT,
  MAX_IMAGE_SIZE,
  type UploadedImage,
  imageUrl,
} from '@/lib/images';

import { uploadImage } from './actions';

// Read in the browser, so the server doesn't need to decode images.
const measureImage = async (file: File) => {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    return { width, height };
  } catch {
    return undefined;
  }
};

export function ImagePreview({
  image,
  alt = '',
  className,
}: {
  image: UploadedImage;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Previews in the cms don't need next/image.
    <img
      src={imageUrl(image.path)}
      alt={alt}
      width={image.width}
      height={image.height}
      className={className}
    />
  );
}

// Uploads the chosen file right away, to the site in the URL. id goes on the
// button, so a <label> can point at it.
export function ImagePicker({
  id,
  value,
  onChange,
  onRemove,
}: {
  id?: string;
  value?: UploadedImage;
  onChange: (image: UploadedImage) => void;
  onRemove?: () => void;
}) {
  // Read from the URL rather than passed down, since the body editor's image
  // blocks have one too.
  const { site } = useParams<{ site: string }>();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isUploading, startUploading] = useTransition();

  const upload = (file: File) => {
    setError(undefined);
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Bilden får vara högst 1 MB.');
      return;
    }

    startUploading(async () => {
      const size = await measureImage(file);
      if (!size) {
        setError('Kunde inte läsa bilden.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      try {
        const result = await uploadImage(site, formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onChange({ path: result.path, ...size });
      } catch (error) {
        console.error('uploadImage failed', error);
        setError('Kunde inte ladda upp bilden.');
      }
    });
  };

  return (
    <div className='flex flex-col gap-2'>
      {value && (
        <ImagePreview
          image={value}
          className='h-auto max-h-80 w-auto max-w-full self-start rounded-md border border-zinc-200 dark:border-zinc-800'
        />
      )}
      <div className='flex flex-wrap items-center gap-2'>
        <button
          id={id}
          type='button'
          onClick={() => input.current?.click()}
          disabled={isUploading}
          className='shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800'
        >
          {isUploading ? 'Laddar upp…' : value ? 'Byt bild' : 'Välj bild'}
        </button>
        {value && onRemove && (
          <button
            type='button'
            onClick={onRemove}
            disabled={isUploading}
            className='shrink-0 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950'
          >
            Ta bort bild
          </button>
        )}
        <span className='text-xs text-zinc-500'>
          JPEG, PNG, WebP eller GIF, högst 1 MB.
        </span>
      </div>
      {error && (
        <p role='alert' className='text-xs text-red-600 dark:text-red-400'>
          {error}
        </p>
      )}
      <input
        ref={input}
        type='file'
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Cleared, so choosing the same file again still triggers a change.
          event.target.value = '';
          if (file) {
            upload(file);
          }
        }}
      />
    </div>
  );
}
