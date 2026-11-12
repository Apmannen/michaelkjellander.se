'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { secondaryButtonClass } from './field';

export function ConfirmDeleteDialog({
  heading,
  message,
  onConfirm,
  onClose,
}: {
  heading: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  // Portaled out of the editor's <form>, so its buttons can't submit it.
  return createPortal(
    <dialog
      ref={dialog}
      onClose={onClose}
      className='m-auto w-full max-w-md rounded-lg bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-900 dark:text-zinc-100'
    >
      <div className='flex flex-col gap-5 p-6'>
        <h2 className='text-base font-semibold'>{heading}</h2>
        <p className='text-sm text-zinc-600 dark:text-zinc-400'>{message}</p>
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
