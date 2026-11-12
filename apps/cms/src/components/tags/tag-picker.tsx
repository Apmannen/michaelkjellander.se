'use client';

import { type KeyboardEvent, useState } from 'react';

import type { Tag } from '@/lib/tags';

import { inputClass } from '../editor/Field';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Picks any number of tags, kept in the order they were picked. Tags in
// excluded can't be picked, e.g. a tag itself when picking its parents. Ids
// of tags that no longer exist are kept but not shown, and dropped when
// saving.
export function TagPicker({
  id,
  tags,
  value,
  onChange,
  excluded,
}: {
  id: string;
  tags: Tag[];
  value: string[];
  onChange: (value: string[]) => void;
  excluded?: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  const selected = value.flatMap((tagId) => {
    const tag = byId.get(tagId);
    return tag ? [tag] : [];
  });

  const search = normalize(query.trim());
  const options = tags.filter(
    (tag) =>
      !value.includes(tag.id) &&
      !excluded?.has(tag.id) &&
      (normalize(tag.name).includes(search) || tag.slug.includes(search)),
  );
  const listId = `${id}-options`;
  const isListShown = isOpen && options.length > 0;
  const active = Math.min(activeIndex, options.length - 1);

  const add = (tag: Tag) => {
    onChange([...value, tag.id]);
    setQuery('');
    setActiveIndex(0);
  };

  const remove = (tagId: string) => {
    onChange(value.filter((other) => other !== tagId));
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
      return;
    }
    if (event.key === 'Backspace' && !query && selected.length) {
      remove(selected[selected.length - 1].id);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      {selected.length > 0 && (
        <ul className='flex flex-wrap gap-1.5'>
          {selected.map((tag) => (
            <li
              key={tag.id}
              className='flex items-center gap-1 rounded-full bg-zinc-100 py-0.5 pr-1 pl-3 text-sm dark:bg-zinc-800'
            >
              {tag.name}
              <button
                type='button'
                onClick={() => remove(tag.id)}
                aria-label={`Ta bort ${tag.name}`}
                title='Ta bort'
                className='flex size-5 items-center justify-center rounded-full text-xs text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100'
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
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
            tags.length ? 'Sök och lägg till tagg…' : 'Det finns inga taggar än.'
          }
          disabled={!tags.length}
          autoComplete='off'
          className={inputClass}
        />
        {isListShown && (
          <ul
            id={listId}
            role='listbox'
            className='absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'
          >
            {options.map((tag, index) => (
              <li
                key={tag.id}
                id={`${listId}-${tag.id}`}
                role='option'
                aria-selected={index === active}
                // mousedown would blur the input and close the list before
                // the click.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(tag)}
                onMouseEnter={() => setActiveIndex(index)}
                className='flex cursor-pointer items-baseline justify-between gap-3 rounded px-2 py-1.5 text-sm aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950'
              >
                <span className='truncate'>{tag.name}</span>
                <span className='shrink-0 font-mono text-xs text-zinc-500'>
                  {tag.slug}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
