'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { PiX } from 'react-icons/pi';

import { type Issue, type IssueInput, formatIssueKey } from '@/lib/issues';

import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import {
  EditorFooter,
  useUnsavedChangesWarning,
} from '../editor/EditorFooter';
import { Field, inputClass } from '../editor/Field';
import { deleteIssue, saveIssue } from './actions';

const toInput = (issue?: Issue): IssueInput => ({
  title: issue?.title ?? '',
  text: issue?.text ?? '',
});

const isSame = (a: IssueInput, b: IssueInput) =>
  a.title === b.title && a.text === b.text;

const DISCARD_MESSAGE = 'Du har osparade ändringar. Vill du stänga ändå?';

// Opened over the board. columnId is where a new issue is added, and
// columnName is shown in the heading.
export function IssueDialog({
  siteId,
  issue,
  columnId,
  columnName,
}: {
  siteId: string;
  issue?: Issue;
  columnId: string;
  columnName?: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState<IssueInput>(() => toInput(issue));
  const [draft, setDraft] = useState<IssueInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const close = () => {
    if (isDirty && !window.confirm(DISCARD_MESSAGE)) {
      return;
    }
    router.push(`/${siteId}/issues`);
  };

  const update = (patch: Partial<IssueInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveIssue(siteId, issue?.id, columnId, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.issue);
      setSaved(next);
      setDraft(next);
    });
  };

  const remove = (id: string) => {
    setIsConfirmingDelete(false);
    startDeleting(async () => {
      const result = await deleteIssue(siteId, id);
      setError(result.error);
    });
  };

  const key = issue ? formatIssueKey(siteId, issue.number) : undefined;

  return (
    <dialog
      ref={dialog}
      // Escape closes the dialog, unless there are changes to keep.
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      // Clicks outside the dialog land on the dialog itself, i.e. the
      // backdrop.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
      className='m-auto max-h-[90vh] open:flex w-full max-w-2xl flex-col rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100'
    >
      <form
        className='flex min-h-0 flex-1 flex-col'
        onSubmit={(event) => {
          event.preventDefault();
          if (isDirty) {
            save();
          }
        }}
      >
        <header className='flex items-center gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800'>
          <h1 className='min-w-0 flex-1 truncate text-sm font-medium'>
            {key ? (
              <>
                <span className='text-zinc-500'>{key}</span>{' '}
                {saved.title}
              </>
            ) : (
              `Nytt ärende${columnName ? ` i ${columnName}` : ''}`
            )}
          </h1>
          {!issue && (
            <span className='shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
              Ej sparad
            </span>
          )}
          <button
            type='button'
            onClick={close}
            aria-label='Stäng'
            className='rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800'
          >
            <PiX />
          </button>
        </header>

        <div className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6'>
          <Field label='Rubrik' htmlFor='title'>
            <input
              id='title'
              type='text'
              value={draft.title}
              onChange={(event) => update({ title: event.target.value })}
              className={inputClass}
              autoFocus={!issue}
              autoComplete='off'
            />
          </Field>

          <Field label='Text' htmlFor='text' description='Valfri.'>
            <textarea
              id='text'
              value={draft.text}
              onChange={(event) => update({ text: event.target.value })}
              rows={10}
              className={`${inputClass} resize-y`}
              placeholder='Beskriv ärendet…'
            />
          </Field>
        </div>

        <EditorFooter
          error={error}
          isDirty={isDirty}
          isSaved={!!issue}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onUndo={() => {
            setDraft(saved);
            setError(undefined);
          }}
          onDelete={() => setIsConfirmingDelete(true)}
        />
      </form>

      {issue && isConfirmingDelete && (
        <ConfirmDeleteDialog
          heading='Ta bort ärende?'
          message={`${key} ”${saved.title}” tas bort från tavlan.`}
          onConfirm={() => remove(issue.id)}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </dialog>
  );
}
