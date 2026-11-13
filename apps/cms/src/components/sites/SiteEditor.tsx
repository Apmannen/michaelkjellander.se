'use client';

import { useState, useTransition } from 'react';

import type { NewSiteInput, Site } from '@/lib/sites';

import {
  EditorFooter,
  useUnsavedChangesWarning,
} from '../editor/EditorFooter';
import { Field, inputClass, secondaryButtonClass } from '../editor/Field';
import { SlugField } from '../editor/SlugField';
import { createSite, updateSite } from './actions';

const toInput = (site?: Site): NewSiteInput => ({
  id: site?.id ?? '',
  name: site?.name ?? '',
  url: site?.url ?? '',
  api_secret: site?.api_secret ?? '',
});

const isSame = (a: NewSiteInput, b: NewSiteInput) =>
  a.id === b.id &&
  a.name === b.name &&
  a.url === b.url &&
  a.api_secret === b.api_secret;

// Creates a site when site is left out. The id can only be picked then.
export function SiteEditor({ site }: { site?: Site }) {
  const [saved, setSaved] = useState<NewSiteInput>(() => toInput(site));
  const [draft, setDraft] = useState<NewSiteInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isSecretShown, setIsSecretShown] = useState(false);

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  const update = (patch: Partial<NewSiteInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      if (!site) {
        // Goes to the new site when it succeeds.
        const result = await createSite(draft);
        setError(result.error);
        return;
      }
      const result = await updateSite(site.id, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.site);
      setSaved(next);
      setDraft(next);
    });
  };

  return (
    <form
      className='flex h-full flex-col'
      onSubmit={(event) => {
        event.preventDefault();
        if (isDirty) {
          save();
        }
      }}
    >
      <header className='flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800'>
        <h1 className='truncate text-sm font-medium'>
          {site ? 'Sajtinställningar' : 'Ny sajt'}
        </h1>
        {!site && (
          <span className='shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
            Ej sparad
          </span>
        )}
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8'>
          <Field
            label='Namn'
            htmlFor='name'
            description='Visas i sajtmenyn.'
          >
            <input
              id='name'
              type='text'
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
              className={inputClass}
              autoFocus={!site}
              autoComplete='off'
            />
          </Field>

          <Field
            label='ID'
            htmlFor='id'
            description={
              site
                ? 'Används i CMS:ets adresser och kan inte ändras.'
                : 'Används i CMS:ets adresser, t.ex. ”mk”. Kan inte ändras efteråt.'
            }
          >
            {site ? (
              <input
                id='id'
                type='text'
                value={draft.id}
                readOnly
                className={`${inputClass} font-mono text-zinc-500`}
              />
            ) : (
              <SlugField
                id='id'
                value={draft.id}
                source={draft.name}
                onChange={(id) => update({ id })}
              />
            )}
          </Field>

          <Field
            label='Adress'
            htmlFor='url'
            description='Där sajten körs, t.ex. https://example.com. Triggers skickas hit.'
          >
            <input
              id='url'
              type='url'
              value={draft.url}
              onChange={(event) => update({ url: event.target.value })}
              placeholder='https://'
              className={`${inputClass} font-mono`}
              autoComplete='off'
            />
          </Field>

          <Field
            label='API-nyckel'
            htmlFor='api_secret'
            description='Skickas till sajten när triggers körs. Måste vara samma som sajtens CMS_SITE_API_SECRET.'
          >
            <div className='flex gap-2'>
              <input
                id='api_secret'
                type={isSecretShown ? 'text' : 'password'}
                value={draft.api_secret}
                onChange={(event) =>
                  update({ api_secret: event.target.value })
                }
                className={`${inputClass} font-mono`}
                autoComplete='off'
              />
              <button
                type='button'
                onClick={() => setIsSecretShown((shown) => !shown)}
                className={secondaryButtonClass}
              >
                {isSecretShown ? 'Dölj' : 'Visa'}
              </button>
            </div>
          </Field>
        </div>
      </div>

      <EditorFooter
        error={error}
        isDirty={isDirty}
        isSaved={!!site}
        isSaving={isSaving}
        isDeleting={false}
        onUndo={() => {
          setDraft(saved);
          setError(undefined);
        }}
      />
    </form>
  );
}
