'use client';

import { useState, useTransition } from 'react';

import { withParagraphSlots } from '@/lib/body';
import {
  TAG_DESCRIPTION_FEATURES,
  type Tag,
  type TagInput,
  findDescendantIds,
} from '@/lib/tags';

import { BodyEditor } from '../body/BodyEditor';
import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import {
  EditorFooter,
  useUnsavedChangesWarning,
} from '../editor/EditorFooter';
import { Field, inputClass } from '../editor/Field';
import { SlugField } from '../editor/SlugField';
import { deleteTag, saveTag } from './actions';
import { TagPicker } from './tag-picker';

const toInput = (tag?: Tag): TagInput => ({
  name: tag?.name ?? '',
  slug: tag?.slug ?? '',
  description: withParagraphSlots(tag?.description ?? []),
  parent_ids: tag?.parent_ids ?? [],
});

const isSame = (a: TagInput, b: TagInput) =>
  a.name === b.name &&
  a.slug === b.slug &&
  JSON.stringify(a.description) === JSON.stringify(b.description) &&
  JSON.stringify(a.parent_ids) === JSON.stringify(b.parent_ids);

// tags are all tags, which the parents are picked from.
export function TagEditor({ tag, tags }: { tag?: Tag; tags: Tag[] }) {
  const [saved, setSaved] = useState<TagInput>(() => toInput(tag));
  const [draft, setDraft] = useState<TagInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  // A tag can't be its own parent, or the parent of a tag above it.
  const excludedParents = tag ? findDescendantIds(tags, tag.id) : undefined;

  const update = (patch: Partial<TagInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveTag(tag?.id, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.tag);
      setSaved(next);
      setDraft(next);
    });
  };

  const remove = (id: string) => {
    setIsConfirmingDelete(false);
    startDeleting(async () => {
      const result = await deleteTag(id);
      setError(result.error);
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
          {draft.name.trim() || 'Ny tagg'}
        </h1>
        {!tag && (
          <span className='shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
            Ej sparad
          </span>
        )}
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8'>
          <Field label='Namn' htmlFor='name'>
            <input
              id='name'
              type='text'
              value={draft.name}
              onChange={(event) => update({ name: event.target.value })}
              className={inputClass}
              autoFocus={!tag}
              autoComplete='off'
            />
          </Field>

          <Field
            label='Slug'
            htmlFor='slug'
            description='Används i taggens adress.'
          >
            <SlugField
              id='slug'
              value={draft.slug}
              source={draft.name}
              onChange={(slug) => update({ slug })}
            />
          </Field>

          <Field
            label='Beskrivning'
            htmlFor='description'
            description='Valfri. Enter ger nytt stycke, Shift+Enter ger radbrytning. Markera text och tryck Ctrl+K för länk.'
          >
            <BodyEditor
              id='description'
              value={draft.description}
              onChange={(description) => update({ description })}
              features={TAG_DESCRIPTION_FEATURES}
              placeholder='Skriv en beskrivning…'
            />
          </Field>

          <Field
            label='Föräldrataggar'
            htmlFor='parent_ids'
            description='Valfria. Taggen hamnar under dem, t.ex. Metroidvania under Spel.'
          >
            <TagPicker
              id='parent_ids'
              tags={tags}
              value={draft.parent_ids}
              onChange={(parent_ids) => update({ parent_ids })}
              excluded={excludedParents}
            />
          </Field>
        </div>
      </div>

      <EditorFooter
        error={error}
        isDirty={isDirty}
        isSaved={!!tag}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onUndo={() => {
          setDraft(saved);
          setError(undefined);
        }}
        onDelete={() => setIsConfirmingDelete(true)}
      />

      {tag && isConfirmingDelete && (
        <ConfirmDeleteDialog
          heading='Ta bort tagg?'
          message={`”${saved.name}” tas bort och kopplas bort från alla artiklar och undertaggar.`}
          onConfirm={() => remove(tag.id)}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </form>
  );
}
