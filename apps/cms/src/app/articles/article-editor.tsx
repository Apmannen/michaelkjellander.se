'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { type Article, type ArticleInput, slugify } from '@/lib/articles';

import { saveArticle } from './actions';

const EMPTY: ArticleInput = { title: '', slug: '', published: false };

const toInput = (article: Article | null): ArticleInput =>
  article
    ? { title: article.title, slug: article.slug, published: article.published }
    : EMPTY;

const isSame = (a: ArticleInput, b: ArticleInput) =>
  a.title === b.title && a.slug === b.slug && a.published === b.published;

export function ArticleEditor({ article }: { article: Article | null }) {
  const router = useRouter();
  const [saved, setSaved] = useState<ArticleInput>(() => toInput(article));
  const [draft, setDraft] = useState<ArticleInput>(saved);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

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
      if (!article) router.replace(`/articles/${result.article.id}`);
    });
  };

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (isDirty) save();
      }}
    >
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <h1 className="truncate text-sm font-medium">
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

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
          <Field label="Rubrik" htmlFor="title">
            <input
              id="title"
              type="text"
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              className={inputClass}
              autoFocus={!article}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            description="Används i artikelns adress."
          >
            <div className="flex gap-2">
              <input
                id="slug"
                type="text"
                value={draft.slug}
                onChange={(event) => update({ slug: event.target.value })}
                className={`${inputClass} font-mono`}
              />
              <button
                type="button"
                onClick={() => update({ slug: slugify(draft.title) })}
                disabled={!draft.title.trim()}
                className={secondaryButtonClass}
              >
                Generera
              </button>
            </div>
          </Field>

          <Field label="Publicerad" htmlFor="published">
            <label className="inline-flex cursor-pointer items-center gap-3">
              <input
                id="published"
                type="checkbox"
                role="switch"
                checked={draft.published}
                onChange={(event) => update({ published: event.target.checked })}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 rounded-full bg-zinc-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 dark:bg-zinc-700" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {draft.published ? 'Ja' : 'Nej'}
              </span>
            </label>
          </Field>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-4 border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <p
          role="status"
          className={`mr-auto text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}
        >
          {error ?? (isDirty ? 'Osparade ändringar' : article ? 'Allt sparat' : '')}
        </p>
        {isDirty && article && (
          <button
            type="button"
            onClick={() => {
              setDraft(saved);
              setError(null);
            }}
            disabled={isSaving}
            className={secondaryButtonClass}
          >
            Ångra ändringar
          </button>
        )}
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? 'Sparar…' : 'Spara'}
        </button>
      </footer>
    </form>
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
    <div className="flex flex-col gap-2">
      <div>
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </label>
        {description && (
          <p className="text-xs text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
