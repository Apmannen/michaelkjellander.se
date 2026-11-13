'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';

import type { Article, ArticleInput, ArticleSummary } from '@/lib/articles';
import { withParagraphSlots } from '@/lib/body';
import type { FieldDefinition } from '@/lib/fields';
import type { UploadedImage } from '@/lib/images';
import type { Tag } from '@/lib/tags';

import { BodyEditor } from '../body/BodyEditor';
import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import {
  EditorFooter,
  useUnsavedChangesWarning,
} from '../editor/EditorFooter';
import { Field, inputClass } from '../editor/Field';
import { SlugField } from '../editor/SlugField';
import { ArticleFieldsField } from '../fields/ArticleFieldsField';
import { ImagePicker } from '../images/image-picker';
import { TagPicker } from '../tags/tag-picker';
import { deleteArticle, saveArticle } from './actions';
import { CallToActionField } from './CallToActionField';

// New articles default to the current minute.
const now = () => {
  const date = new Date();
  date.setSeconds(0, 0);
  return date.toISOString();
};

const toInput = (article: Article | null): ArticleInput => ({
  title: article?.title ?? '',
  slug: article?.slug ?? '',
  intro: article?.intro ?? '',
  cta: article?.cta,
  published: article?.published ?? false,
  published_at: article ? new Date(article.published_at).toISOString() : now(),
  cover_image: article?.cover_image,
  body: withParagraphSlots(article?.body ?? []),
  tag_ids: article?.tag_ids ?? [],
  field_values: article?.field_values ?? [],
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
  a.intro === b.intro &&
  // Compared field by field, since jsonb doesn't keep the key order.
  a.cta?.icon === b.cta?.icon &&
  a.cta?.text === b.cta?.text &&
  a.cta?.href === b.cta?.href &&
  a.published === b.published &&
  a.published_at === b.published_at &&
  JSON.stringify(a.cover_image) === JSON.stringify(b.cover_image) &&
  JSON.stringify(a.body) === JSON.stringify(b.body) &&
  JSON.stringify(a.tag_ids) === JSON.stringify(b.tag_ids) &&
  JSON.stringify(a.field_values) === JSON.stringify(b.field_values);

// tags are all of the site's tags, which the article's tags are picked from.
// fieldDefinitions are the site's dynamic fields, and articles the articles
// that link fields can link to.
export function ArticleEditor({
  siteId,
  article,
  tags,
  fieldDefinitions,
  articles,
}: {
  siteId: string;
  article: Article | null;
  tags: Tag[];
  fieldDefinitions: FieldDefinition[];
  articles: ArticleSummary[];
}) {
  const [saved, setSaved] = useState<ArticleInput>(() => toInput(article));
  const [draft, setDraft] = useState<ArticleInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isClient = useIsClient();

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  const update = (patch: Partial<ArticleInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  // Uploads finish later, so the alt text is read from the current draft
  // rather than from when the upload started.
  const setCoverImage = (image: UploadedImage) => {
    setDraft((current) => ({
      ...current,
      cover_image: { ...image, alt: current.cover_image?.alt ?? '' },
    }));
    setError(undefined);
  };

  const setCoverAlt = (alt: string) => {
    setDraft((current) =>
      current.cover_image
        ? { ...current, cover_image: { ...current.cover_image, alt } }
        : current,
    );
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveArticle(siteId, article?.id ?? null, draft);
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
      const result = await deleteArticle(siteId, id);
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
            <SlugField
              id='slug'
              value={draft.slug}
              source={draft.title}
              onChange={(slug) => update({ slug })}
            />
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
            label='Intro'
            htmlFor='intro'
            description='Visas under rubriken. En kort mening, utan punkt på slutet.'
          >
            <textarea
              id='intro'
              rows={2}
              value={draft.intro}
              onChange={(event) => update({ intro: event.target.value })}
              className={`${inputClass} resize-y`}
            />
          </Field>

          <Field
            label='Knapp'
            htmlFor='cta'
            description='Valfri call to action som visas under introt. Ikonen är valfri. Töm fälten för att ta bort knappen.'
          >
            <CallToActionField
              id='cta'
              value={draft.cta}
              onChange={(cta) => update({ cta })}
            />
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

          <Field label='Taggar' htmlFor='tag_ids'>
            <TagPicker
              id='tag_ids'
              tags={tags}
              value={draft.tag_ids}
              onChange={(tag_ids) => update({ tag_ids })}
            />
          </Field>

          <Field
            label='Fält'
            htmlFor='field_values'
            description='Valfria. Sajtens dynamiska fält, t.ex. Spela även.'
          >
            <ArticleFieldsField
              id='field_values'
              definitions={fieldDefinitions}
              articles={articles}
              articleId={article?.id}
              value={draft.field_values}
              onChange={(field_values) => update({ field_values })}
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

      <EditorFooter
        error={error}
        isDirty={isDirty}
        isSaved={!!article}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onUndo={() => {
          setDraft(saved);
          setError(undefined);
        }}
        onDelete={() => setIsConfirmingDelete(true)}
      />

      {article && isConfirmingDelete && (
        <ConfirmDeleteDialog
          heading='Ta bort artikel?'
          message={`”${saved.title}” tas bort och försvinner från sajten.`}
          onConfirm={() => remove(article.id)}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </form>
  );
}
