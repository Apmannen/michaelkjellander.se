'use client';

import { type KeyboardEvent, useState } from 'react';

import type { WordGuessQuestion } from '@/lib/word-guess';

import { inputClass } from '../editor/Field';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const iconButtonClass =
  'flex size-7 items-center justify-center rounded text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-700 dark:hover:text-zinc-100';

// Picks any number of questions, in an order that can be changed. Questions
// in excluded can't be picked, e.g. ones used by other levels. Ids of
// questions that no longer exist are kept but not shown, and dropped when
// saving.
export function QuestionPicker({
  id,
  questions,
  value,
  onChange,
  excluded,
}: {
  id: string;
  questions: WordGuessQuestion[];
  value: string[];
  onChange: (value: string[]) => void;
  excluded?: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const byId = new Map(questions.map((question) => [question.id, question]));
  const selected = value.flatMap((questionId) => {
    const question = byId.get(questionId);
    return question ? [question] : [];
  });

  const search = normalize(query.trim());
  const options = questions.filter(
    (question) =>
      !value.includes(question.id) &&
      !excluded?.has(question.id) &&
      (normalize(question.answer).includes(search) ||
        normalize(question.clue).includes(search)),
  );
  const isAllTaken = questions.every(
    (question) => value.includes(question.id) || excluded?.has(question.id),
  );
  const listId = `${id}-options`;
  const isListShown = isOpen && options.length > 0;
  const active = Math.min(activeIndex, options.length - 1);

  const add = (question: WordGuessQuestion) => {
    onChange([...value, question.id]);
    setQuery('');
    setActiveIndex(0);
  };

  const remove = (questionId: string) => {
    onChange(value.filter((other) => other !== questionId));
  };

  // Moves among the shown questions, so hidden ids don't take up steps.
  const move = (index: number, step: number) => {
    const ids = selected.map((question) => question.id);
    const target = index + step;
    if (target < 0 || target >= ids.length) {
      return;
    }
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onChange(ids);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        (Math.max(active, 0) + step + options.length) %
          Math.max(options.length, 1),
      );
      return;
    }
    // Enter would otherwise submit the editor's form.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (isListShown && options[active]) {
        add(options[active]);
      }
      return;
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      {selected.length > 0 && (
        <ol className='flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800'>
          {selected.map((question, index) => (
            <li
              key={question.id}
              className='flex items-center gap-3 py-1.5 pr-1.5 pl-3 text-sm'
            >
              <span className='w-5 shrink-0 text-xs text-zinc-500'>
                {index + 1}.
              </span>
              <span className='shrink-0'>{question.emoji}</span>
              <span className='min-w-0 flex-1 truncate'>
                <span className='font-medium'>{question.answer}</span>
                <span className='text-zinc-500'> – {question.clue}</span>
              </span>
              <button
                type='button'
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Flytta upp ${question.answer}`}
                title='Flytta upp'
                className={iconButtonClass}
              >
                ↑
              </button>
              <button
                type='button'
                onClick={() => move(index, 1)}
                disabled={index === selected.length - 1}
                aria-label={`Flytta ner ${question.answer}`}
                title='Flytta ner'
                className={iconButtonClass}
              >
                ↓
              </button>
              <button
                type='button'
                onClick={() => remove(question.id)}
                aria-label={`Ta bort ${question.answer}`}
                title='Ta bort'
                className={iconButtonClass}
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className='relative'>
        <input
          id={id}
          type='text'
          role='combobox'
          aria-expanded={isListShown}
          aria-controls={listId}
          aria-autocomplete='list'
          aria-activedescendant={
            isListShown ? `${listId}-${options[active].id}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={
            !questions.length
              ? 'Det finns inga frågor än.'
              : isAllTaken
                ? 'Alla frågor används redan.'
                : 'Sök och lägg till fråga…'
          }
          disabled={isAllTaken}
          autoComplete='off'
          className={inputClass}
        />
        {isListShown && (
          <ul
            id={listId}
            role='listbox'
            className='absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'
          >
            {options.map((question, index) => (
              <li
                key={question.id}
                id={`${listId}-${question.id}`}
                role='option'
                aria-selected={index === active}
                // mousedown would blur the input and close the list before
                // the click.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(question)}
                onMouseEnter={() => setActiveIndex(index)}
                className='flex cursor-pointer items-baseline gap-2 rounded px-2 py-1.5 text-sm aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950'
              >
                <span className='shrink-0'>{question.emoji}</span>
                <span className='truncate font-medium'>{question.answer}</span>
                <span className='truncate text-xs text-zinc-500'>
                  {question.clue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
