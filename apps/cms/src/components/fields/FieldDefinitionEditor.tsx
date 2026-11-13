'use client';

import { useState, useTransition } from 'react';

import {
  FIELD_TYPES,
  type FieldDefinition,
  type FieldDefinitionInput,
  type FieldType,
  toFieldKey,
} from '@/lib/fields';

import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import {
  EditorFooter,
  useUnsavedChangesWarning,
} from '../editor/EditorFooter';
import { Field, inputClass } from '../editor/Field';
import { SlugField } from '../editor/SlugField';
import { deleteFieldDefinition, saveFieldDefinition } from './actions';

const toInput = (field?: FieldDefinition): FieldDefinitionInput => ({
  key: field?.key ?? '',
  label: field?.label ?? '',
  type: field?.type ?? 'text',
  multiple: field?.multiple ?? false,
  description: field?.description ?? '',
});

const isSame = (a: FieldDefinitionInput, b: FieldDefinitionInput) =>
  a.key === b.key &&
  a.label === b.label &&
  a.type === b.type &&
  a.multiple === b.multiple &&
  a.description === b.description;

export function FieldDefinitionEditor({
  siteId,
  field,
}: {
  siteId: string;
  field?: FieldDefinition;
}) {
  const [saved, setSaved] = useState<FieldDefinitionInput>(() =>
    toInput(field),
  );
  const [draft, setDraft] = useState<FieldDefinitionInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  const update = (patch: Partial<FieldDefinitionInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveFieldDefinition(siteId, field?.id, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.field);
      setSaved(next);
      setDraft(next);
    });
  };

  const remove = (id: string) => {
    setIsConfirmingDelete(false);
    startDeleting(async () => {
      const result = await deleteFieldDefinition(siteId, id);
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
          {draft.label.trim() || 'Nytt fält'}
        </h1>
        {!field && (
          <span className='shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
            Ej sparat
          </span>
        )}
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8'>
          <Field
            label='Etikett'
            htmlFor='label'
            description='Visas i CMS:et, och kan visas på sajten, t.ex. Spela även.'
          >
            <input
              id='label'
              type='text'
              value={draft.label}
              onChange={(event) => update({ label: event.target.value })}
              className={inputClass}
              autoFocus={!field}
              autoComplete='off'
            />
          </Field>

          <Field
            label='Nyckel'
            htmlFor='key'
            description={
              field
                ? 'Sajten hittar fältet med nyckeln, t.ex. play_also. Byter du nyckel måste sajten ändras också.'
                : 'Sajten hittar fältet med nyckeln, t.ex. play_also. a–z, 0–9 och understreck.'
            }
          >
            <SlugField
              id='key'
              value={draft.key}
              source={draft.label}
              onChange={(key) => update({ key })}
              generate={toFieldKey}
            />
          </Field>

          <Field
            label='Typ'
            htmlFor='type'
            description='Kan inte ändras efter att fältet har skapats.'
          >
            <select
              id='type'
              value={draft.type}
              onChange={(event) =>
                update({ type: event.target.value as FieldType })
              }
              disabled={!!field}
              className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {Object.entries(FIELD_TYPES).map(([type, { label }]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
            <p className='text-xs text-zinc-500'>
              {FIELD_TYPES[draft.type].description}
            </p>
          </Field>

          <Field
            label='Flera värden'
            htmlFor='multiple'
            description={
              field && saved.multiple
                ? 'Om du stänger av det behåller artiklar bara sitt första värde nästa gång de sparas.'
                : 'Om en artikel kan ha fältet mer än en gång, t.ex. flera spel under Spela även.'
            }
          >
            <label className='inline-flex cursor-pointer items-center gap-2 text-sm'>
              <input
                id='multiple'
                type='checkbox'
                checked={draft.multiple}
                onChange={(event) =>
                  update({ multiple: event.target.checked })
                }
                className='size-4'
              />
              Tillåt flera värden
            </label>
          </Field>

          <Field
            label='Hjälptext'
            htmlFor='description'
            description='Valfri. Visas under fältet när det fylls i på en artikel.'
          >
            <input
              id='description'
              type='text'
              value={draft.description}
              onChange={(event) =>
                update({ description: event.target.value })
              }
              className={inputClass}
              autoComplete='off'
            />
          </Field>
        </div>
      </div>

      <EditorFooter
        error={error}
        isDirty={isDirty}
        isSaved={!!field}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onUndo={() => {
          setDraft(saved);
          setError(undefined);
        }}
        onDelete={() => setIsConfirmingDelete(true)}
      />

      {field && isConfirmingDelete && (
        <ConfirmDeleteDialog
          heading='Ta bort fält?'
          message={`”${saved.label}” tas bort, och fältets värden försvinner från alla artiklar.`}
          onConfirm={() => remove(field.id)}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </form>
  );
}
