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

export function IconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (name?: string) => void;
}) {
  const icons = useIcons();
  const [query, setQuery] = useState('');
  const results = icons ? searchIcons(icons, query) : [];

  // Enter would otherwise submit the dialog the picker is in.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      {value && (
        <div className='flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950'>
          <Icon name={value} className='size-5 shrink-0' />
          <span className='truncate text-sm'>{value}</span>
          <button
            type='button'
            onClick={() => onChange(undefined)}
            className='ml-auto rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
          >
            Ta bort ikon
          </button>
        </div>
      )}

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
        disabled={!icons}
        autoComplete='off'
        aria-label='Sök ikon'
        className='w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950'
      />

      {query.trim() && icons && (
        <>
          {results.length ? (
            <div className='grid max-h-56 grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1 overflow-y-auto'>
              {results.slice(0, MAX_RESULTS).map((name) => (
                <button
                  key={name}
                  type='button'
                  onClick={() => onChange(name)}
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
