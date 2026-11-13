'use client';

import { useEffect } from 'react';

import { secondaryButtonClass } from './Field';

// Asks before leaving the page while there are unsaved changes.
export const useUnsavedChangesWarning = (isDirty: boolean) => {
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);
};

// The status and buttons under an editor's <form>. The save button submits
// the form. isSaved tells whether the document exists yet, which is when it
// can be deleted, if onDelete is given.
export function EditorFooter({
  error,
  isDirty,
  isSaved,
  isSaving,
  isDeleting,
  onUndo,
  onDelete,
}: {
  error?: string;
  isDirty: boolean;
  isSaved: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onUndo: () => void;
  onDelete?: () => void;
}) {
  return (
    <footer className='flex items-center justify-end gap-4 border-t border-zinc-200 px-6 py-3 dark:border-zinc-800'>
      <p
        role='status'
        className={`mr-auto text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'}`}
      >
        {error ?? (isDirty ? 'Osparade ändringar' : isSaved ? 'Allt sparat' : '')}
      </p>
      {isDirty && isSaved && (
        <button
          type='button'
          onClick={onUndo}
          disabled={isSaving || isDeleting}
          className={secondaryButtonClass}
        >
          Ångra ändringar
        </button>
      )}
      {isSaved && onDelete && (
        <button
          type='button'
          onClick={onDelete}
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
  );
}
