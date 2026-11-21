'use client';

import { useState, useTransition } from 'react';

import type {
  WordGuessQuestion,
  WordGuessQuestionInput,
} from '@/lib/word-guess';

import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import {
  EditorFooter,
  useUnsavedChangesWarning,
} from '../editor/EditorFooter';
import { Field, inputClass } from '../editor/Field';
import { deleteWordGuessQuestion, saveWordGuessQuestion } from './actions';
import { EmojiField } from './EmojiField';

const toInput = (question?: WordGuessQuestion): WordGuessQuestionInput => ({
  emoji: question?.emoji ?? '',
  clue: question?.clue ?? '',
  answer: question?.answer ?? '',
});

const isSame = (a: WordGuessQuestionInput, b: WordGuessQuestionInput) =>
  a.emoji === b.emoji && a.clue === b.clue && a.answer === b.answer;

export function QuestionEditor({
  siteId,
  question,
}: {
  siteId: string;
  question?: WordGuessQuestion;
}) {
  const [saved, setSaved] = useState<WordGuessQuestionInput>(() =>
    toInput(question),
  );
  const [draft, setDraft] = useState<WordGuessQuestionInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  const update = (patch: Partial<WordGuessQuestionInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveWordGuessQuestion(siteId, question?.id, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.question);
      setSaved(next);
      setDraft(next);
    });
  };

  const remove = (id: string) => {
    setIsConfirmingDelete(false);
    startDeleting(async () => {
      const result = await deleteWordGuessQuestion(siteId, id);
      setError(result.error);
    });
  };

  const title = [draft.emoji.trim(), draft.answer.trim()]
    .filter(Boolean)
    .join(' ');

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
        <h1 className='truncate text-sm font-medium'>{title || 'Ny fråga'}</h1>
        {!question && (
          <span className='shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
            Ej sparad
          </span>
        )}
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8'>
          <Field label='Emoji' htmlFor='emoji' description='T.ex. ☀️.'>
            <EmojiField
              id='emoji'
              value={draft.emoji}
              onChange={(emoji) => update({ emoji })}
              autoFocus={!question}
            />
          </Field>

          <Field
            label='Ledtråd'
            htmlFor='clue'
            description='T.ex. Inte natt.'
          >
            <input
              id='clue'
              type='text'
              value={draft.clue}
              onChange={(event) => update({ clue: event.target.value })}
              className={inputClass}
              autoComplete='off'
            />
          </Field>

          <Field label='Svar' htmlFor='answer' description='T.ex. dag.'>
            <input
              id='answer'
              type='text'
              value={draft.answer}
              onChange={(event) => update({ answer: event.target.value })}
              className={inputClass}
              autoComplete='off'
            />
          </Field>
        </div>
      </div>

      <EditorFooter
        error={error}
        isDirty={isDirty}
        isSaved={!!question}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onUndo={() => {
          setDraft(saved);
          setError(undefined);
        }}
        onDelete={() => setIsConfirmingDelete(true)}
      />

      {question && isConfirmingDelete && (
        <ConfirmDeleteDialog
          heading='Ta bort fråga?'
          message={`”${saved.answer}” tas bort och kopplas bort från alla nivåer.`}
          onConfirm={() => remove(question.id)}
          onClose={() => setIsConfirmingDelete(false)}
        />
      )}
    </form>
  );
}
