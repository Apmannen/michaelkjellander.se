'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from 'react';
import { createPortal } from 'react-dom';

import { type Article, type ArticleInput, slugify } from '@/lib/articles';
import { withParagraphSlots } from '@/lib/body';
import type { UploadedImage } from '@/lib/images';

import { ImagePicker } from '../images/image-picker';
import { deleteArticle, saveArticle } from './actions';
import { BodyEditor } from './body-editor';

// New articles default to the current minute.
const now = () => {
  const date = new Date();
  date.setSeconds(0, 0);
  return date.toISOString();
};

const toInput = (article: Article | null): ArticleInput => ({
  title: article?.title ?? '',
  slug: article?.slug ?? '',
  published: article?.published ?? false,
  published_at: article ? new Date(article.published_at).toISOString() : now(),
  cover_image: article?.cover_image,
  body: withParagraphSlots(article?.body ?? []),
});

// ISO string -> value for <input type="datetime-local">, in the browser's
// time zone.
const toLocalDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// <input type="datetime-local"> value -> ISO string ('' if cleared).
const fromLocalDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString();
};

// The publication time is shown in the browser's time zone, which the server
// doesn't know, so that field is only rendered on the client.
const useIsClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

const isSame = (a: ArticleInput, b: ArticleInput) =>
  a.title === b.title &&
  a.slug === b.slug &&
  a.published === b.published &&
  a.published_at === b.published_at &&
  JSON.stringify(a.cover_image) === JSON.stringify(b.cover_image) &&
  JSON.stringify(a.body) === JSON.stringify(b.body);

export function ArticleEditor({ article }: { article: Article | null }) {
  const [saved, setSaved] = useState<ArticleInput>(() => toInput(article));
  const [draft, setDraft] = useState<ArticleInput>(saved);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isClient = useIsClient();

  const isDirty = !isSame(draft, saved);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  const update = (patch: Partial<ArticleInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(null);
  };

  // Uploads finish later, so the alt text is read from the current draft
  // rather than from when the upload started.
  const setCoverImage = (image: UploadedImage) => {
    setDraft((current) => ({
      ...current,
      cover_image: { ...image, alt: current.cover_image?.alt ?? '' },
    }));
    setError(null);
  };

  const setCoverAlt = (alt: string) => {
    setDraft((current) =>
      current.cover_image
        ? { ...current, cover_image: { ...current.cover_image, alt } }
        : current,
    );
    setError(null);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveArticle(article?.id ?? null, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.article);
      setSaved(next);
      setDraft(next);
    });
  };

  const remove = (id: string) => {
    setIsConfirmingDelete(false);
    startDeleting(async () => {
      const result = await deleteArticle(id);
      setError(result.error);
    });
  };

  return (
    <form
      className='flex h-full flex-col'
      onSubmit={(event) => {
        event.preventDefault();
        if (isDirty) save();
      }}
    >
      <header className='flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800'>
        <h1 className='truncate text-sm font-medium'>
          {draft.title.trim() || 'Ny artikel'}
        </h1>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
            saved.published
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          {article ? (saved.published ? 'Publicerad' : 'Utkast') : 'Ej sparad'}
        </span>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8'>
          <Field label='Rubrik' htmlFor='title'>
            <input
              id='title'
              type='text'
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              className={inputClass}
              autoFocus={!article}
              autoComplete='off'
            />
          </Field>

          <Field
            label='Slug'
            htmlFor='slug'
            description='Används i artikelns adress.'
          >
            <div className='flex gap-2'>
              <input
                id='slug'
                type='text'
                value={draft.slug}
                onChange={(event) => update({ slug: event.target.value })}
                className={`${inputClass} font-mono`}
              />
              <button
                type='button'
                onClick={() => update({ slug: slugify(draft.title) })}
                disabled={!draft.title.trim()}
                className={secondaryButtonClass}
              >
                Generera
              </button>
            </div>
          </Field>

          <Field
            label='Huvudbild'
            htmlFor='cover_image'
            description='Visas ovanför brödtexten.'
          >
            <ImagePicker
              id='cover_image'
              value={draft.cover_image}
              onChange={setCoverImage}
              onRemove={() => update({ cover_image: undefined })}
            />
            {draft.cover_image && (
              <input
                type='text'
                value={draft.cover_image.alt}
                onChange={(event) => setCoverAlt(event.target.value)}
                placeholder='Alternativtext – beskriv bilden för den som inte ser den'
                aria-label='Alternativtext för huvudbilden'
                autoComplete='off'
                className={inputClass}
              />
            )}
          </Field>

          <Field
            label='Brödtext'
            htmlFor='body'
            description='Enter ger nytt stycke, Shift+Enter ger radbrytning. Markera text och tryck Ctrl+B för fet, Ctrl+U för understruken eller Ctrl+K för länk.'
          >
            <BodyEditor
              id='body'
              value={draft.body}
              onChange={(body) => update({ body })}
            />
          </Field>

          <Field label='Publiceringstid' htmlFor='published_at'>
            <input
              id='published_at'
              type='datetime-local'
              value={isClient ? toLocalDateTime(draft.published_at) : ''}
              onChange={(event) =>
                update({ published_at: fromLocalDateTime(event.target.value) })
              }
              className={inputClass}
            />
          </Field>

          <Field label='Publicerad' htmlFor='published'>
            <label className='inline-flex cursor-pointer items-center gap-3'>
              <input
                id='published'
                type='checkbox'
                role='switch'
                checked={draft.published}
                onChange={(event) =>
                  update({ published: event.target.checked })
                }
                className='peer sr-only'
              />
              <span className='relative h-6 w-11 rounded-full bg-zinc-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 dark:bg-zinc-700' />
              <span className='text-sm text-zinc-600 dark:text-zinc-400'>
                {draft.published ? 'Ja' : 'Nej'}
              </span>
            </label>
          </Field>
        </div>
      </div>

      <footer className='flex items-center justify-end gap-4 border-t border-zinc-200 px-6 py-3 dark:border-zinc-800'>
        <p
          role='status'
          className={`mr-auto text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}
        >
          {error ??
            (isDirty ? 'Osparade ändringar' : article ? 'Allt sparat' : '')}
        </p>
        {isDirty && article && (
          <button
            type='button'
            onClick={() => {
              setDraft(saved);
              setError(null);
            }}
            disabled={isSaving || isDeleting}
            className={secondaryButtonClass}
          >
            Ångra ändringar
          </button>
        )}
        {article && (
          <button
            type='button'
            onClick={() => setIsConfirmingDelete(true)}
            disabled={isSaving || isDeleting}
            className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40'
          >
            {isDeleting ? 'Tar bort…' : 'Ta bort'}
          </button>
        )}
        <button
          type='submit'
          disabled={!isDirty || isSaving || isDeleting}
          className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40'
        >
          {isSaving ? 'Sparar…' : 'Spara'}
        </button>
      </footer>

      {article && isConfirmingDelete && (
        <ConfirmDeleteDialog
          title={saved.title}
          onConfirm={() => remove(article.id)}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </form>
  );
}

function ConfirmDeleteDialog({
  title,
  onConfirm,
  onClose,
}: {
  title: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Portaled out of the article <form>, so its buttons can't submit it.
  return createPortal(
    <dialog
      ref={dialog}
      onClose={onClose}
      className='m-auto w-full max-w-md rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100'
    >
      <div className='flex flex-col gap-5 p-6'>
        <h2 className='text-base font-semibold'>Ta bort artikel?</h2>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>
          ”{title}” tas bort och försvinner från sajten.
        </p>
        <div className='flex justify-end gap-3'>
          <button
            type='button'
            onClick={() => dialog.current?.close()}
            autoFocus
            className={secondaryButtonClass}
          >
            Avbryt
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700'
          >
            Ta bort
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900';

const secondaryButtonClass =
  'shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800';

function Field({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <div>
        <label htmlFor={htmlFor} className='text-sm font-semibold'>
          {label}
        </label>
        {description && <p className='text-xs text-zinc-500'>{description}</p>}
      </div>
      {children}
    </div>
  );
}
