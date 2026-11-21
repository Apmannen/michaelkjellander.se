'use client';

import { useState, useTransition } from 'react';

import type {
  WordGuessLevel,
  WordGuessLevelInput,
  WordGuessQuestion,
} from '@/lib/word-guess';

import { ConfirmDeleteDialog } from '../editor/ConfirmDeleteDialog';
import { EditorFooter, useUnsavedChangesWarning } from '../editor/EditorFooter';
import { Field, inputClass } from '../editor/Field';
import { deleteWordGuessLevel, saveWordGuessLevel } from './actions';
import { QuestionPicker } from './QuestionPicker';

const toInput = (level?: WordGuessLevel): WordGuessLevelInput => ({
  sentence: level?.sentence ?? '',
  question_ids: level?.question_ids ?? [],
});

const isSame = (a: WordGuessLevelInput, b: WordGuessLevelInput) =>
  a.sentence === b.sentence &&
  JSON.stringify(a.question_ids) === JSON.stringify(b.question_ids);

// questions are all of the site's questions, which the level's are picked
// from.
export function LevelEditor({
  siteId,
  level,
  questions,
}: {
  siteId: string;
  level?: WordGuessLevel;
  questions: WordGuessQuestion[];
}) {
  const [saved, setSaved] = useState<WordGuessLevelInput>(() => toInput(level));
  const [draft, setDraft] = useState<WordGuessLevelInput>(saved);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const isDirty = !isSame(draft, saved);
  useUnsavedChangesWarning(isDirty);

  const update = (patch: Partial<WordGuessLevelInput>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setError(undefined);
  };

  const save = () => {
    startSaving(async () => {
      const result = await saveWordGuessLevel(siteId, level?.id, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = toInput(result.level);
      setSaved(next);
      setDraft(next);
    });
  };

  const remove = (id: string) => {
    setIsConfirmingDelete(false);
    startDeleting(async () => {
      const result = await deleteWordGuessLevel(siteId, id);
      setError(result.error);
    });
  };

  let num = 1;
  const letterDatas: { letter: string; number: number }[] = [];
  const sentenceArr: string[] = [];
  for (let i = 0; i < draft.sentence.length; i++) {
    sentenceArr.push(draft.sentence[i]);
    const aLetter = draft.sentence[i].toUpperCase();
    if (
      !aLetter ||
      aLetter === ' ' ||
      letterDatas.some((obj) => obj.letter === aLetter)
    ) {
      continue;
    }
    letterDatas.push({ letter: aLetter, number: num++ });
  }

  //console.log('***HEJJ', letterDatas);

  return (
    <>
      <div className='mx-auto flex max-w-2xl flex-col px-6 py-8'>
        <div className='flex'>
          {sentenceArr.map((letter, i) => (
            <span key={i} className='w-6 text-center'>
              {letter}
            </span>
          ))}
        </div>
        <div className='flex'>
          {sentenceArr.map((letter, i) => (
            <span key={i} className='w-6 text-center'>
              {
                letterDatas.find((l) => l.letter === letter.toUpperCase())
                  ?.number
              }
            </span>
          ))}
        </div>
      </div>
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
            {draft.sentence.trim() || 'Ny nivå'}
          </h1>
          {!level && (
            <span className='shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'>
              Ej sparad
            </span>
          )}
        </header>

        <div className='flex-1 overflow-y-auto'>
          <div className='mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8'>
            <Field
              label='Mening'
              htmlFor='sentence'
              description='T.ex. Morgonstund har guld i mund.'
            >
              <input
                id='sentence'
                type='text'
                value={draft.sentence}
                onChange={(event) => update({ sentence: event.target.value })}
                className={inputClass}
                autoFocus={!level}
                autoComplete='off'
              />
            </Field>

            <Field
              label='Frågor'
              htmlFor='question_ids'
              description='I den ordning de visas i spelet.'
            >
              <QuestionPicker
                id='question_ids'
                questions={questions}
                value={draft.question_ids}
                onChange={(question_ids) => update({ question_ids })}
              />
            </Field>
          </div>
        </div>

        <EditorFooter
          error={error}
          isDirty={isDirty}
          isSaved={!!level}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onUndo={() => {
            setDraft(saved);
            setError(undefined);
          }}
          onDelete={() => setIsConfirmingDelete(true)}
        />

        {level && isConfirmingDelete && (
          <ConfirmDeleteDialog
            heading='Ta bort nivå?'
            message={`”${saved.sentence}” tas bort. Frågorna finns kvar.`}
            onConfirm={() => remove(level.id)}
            onClose={() => setIsConfirmingDelete(false)}
          />
        )}
      </form>
    </>
  );
}
