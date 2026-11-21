'use client';

import { useState } from 'react';
import { puzzles } from '@/game/puzzles';
import { GuessWordsGame } from './GuessWordsGame';

export function GuessWordsApp() {
  const [index, setIndex] = useState(0);
  const puzzle = puzzles[index];
  const hasNext = index < puzzles.length - 1;

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col items-center gap-2 pt-8'>
        <h1 className='font-serif text-4xl font-bold sm:text-5xl'>Gissa orden</h1>
        <p className='max-w-md text-center text-sm text-muted'>
          Lös ledtrådarna. Samma nummer betyder samma bokstav, så varje rätt bokstav fylls i överallt.
        </p>
        <nav className='flex items-center gap-4 text-sm'>
          <button
            type='button'
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className='rounded px-2 py-1 text-accent-800 disabled:opacity-30'
          >
            ← Föregående
          </button>
          <span className='tabular-nums text-muted'>
            Pussel {index + 1} av {puzzles.length}
          </span>
          <button
            type='button'
            disabled={!hasNext}
            onClick={() => setIndex(index + 1)}
            className='rounded px-2 py-1 text-accent-800 disabled:opacity-30'
          >
            Nästa →
          </button>
        </nav>
      </header>

      <GuessWordsGame key={puzzle.id} puzzle={puzzle} hasNext={hasNext} onNext={() => setIndex(index + 1)} />
    </div>
  );
}
