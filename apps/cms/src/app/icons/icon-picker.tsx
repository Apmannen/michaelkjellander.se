'use client';

import { type KeyboardEvent, createElement, useEffect, useState } from 'react';
import type { IconType } from 'react-icons';

import { isValidIconName } from '@/lib/body';

const MAX_RESULTS = 120;

type Icons = Map<string, IconType>;

let iconsPromise: Promise<Icons> | undefined;

// The icon sets are large, so they're only loaded once an icon is needed.
const loadIcons = () => {
  iconsPromise ??= Promise.all([
    import('react-icons/fa'),
    import('react-icons/pi'),
  ]).then(
    (sets) =>
      new Map(
        sets.flatMap((set) =>
          Object.entries(set).filter(
            (entry): entry is [string, IconType] =>
              isValidIconName(entry[0]) && typeof entry[1] === 'function',
          ),
        ),
      ),
  );
  return iconsPromise;
};

// Undefined while loading.
const useIcons = () => {
  const [icons, setIcons] = useState<Icons | undefined>(undefined);

  useEffect(() => {
    let isCurrent = true;
    loadIcons().then((loaded) => {
      if (isCurrent) {
        setIcons(loaded);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  return icons;
};

// Every word of the query has to be part of the name, e.g. "git logo" finds
// PiGithubLogo.
const searchIcons = (icons: Icons, query: string) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [];
  }
  return [...icons.keys()].filter((name) => {
    const lower = name.toLowerCase();
    return words.every((word) => lower.includes(word));
  });
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const icon = useIcons()?.get(name);
  return icon ? (
    createElement(icon, { 'aria-hidden': true, className })
  ) : (
    <span
      aria-hidden
      className={`inline-block size-[1em] ${className ?? ''}`}
    />
  );
}

// value is highlighted among the results.
export function IconPicker({
  value,
  onSelect,
}: {
  value?: string;
  onSelect: (name: string) => void;
}) {
  const icons = useIcons();
  const [query, setQuery] = useState('');
  const results = icons ? searchIcons(icons, query) : [];

  // Enter picks the first result instead of submitting a surrounding form.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (results[0]) {
        onSelect(results[0]);
      }
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <input
        type='search'
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={
          icons
            ? `Sök bland ${icons.size} ikoner, t.ex. github`
            : 'Laddar ikoner…'
        }
        autoFocus
        autoComplete='off'
        aria-label='Sök ikon'
        className='w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950'
      />

      {query.trim() && icons && (
        <>
          {results.length ? (
            <div className='grid max-h-56 grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1 overflow-y-auto'>
              {results.slice(0, MAX_RESULTS).map((name) => (
                <button
                  key={name}
                  type='button'
                  onClick={() => onSelect(name)}
                  aria-pressed={name === value}
                  aria-label={name}
                  title={name}
                  className='flex aspect-square items-center justify-center rounded transition-colors hover:bg-zinc-100 aria-pressed:bg-blue-100 aria-pressed:text-blue-700 dark:hover:bg-zinc-800 dark:aria-pressed:bg-blue-950 dark:aria-pressed:text-blue-300'
                >
                  <Icon name={name} className='size-5' />
                </button>
              ))}
            </div>
          ) : (
            <p className='text-xs text-zinc-500'>Inga ikoner hittades.</p>
          )}
          {results.length > MAX_RESULTS && (
            <p className='text-xs text-zinc-500'>
              Visar {MAX_RESULTS} av {results.length}. Sök mer specifikt för att
              hitta fler.
            </p>
          )}
        </>
      )}
    </div>
  );
}
