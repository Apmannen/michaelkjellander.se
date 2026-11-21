'use client';

import { MkLink } from '@/components/standard/MkLink';
import { SentenceGuesserLevelPayload } from '@/lib/db/payload.types';
import { SentenceGuesserLevel } from './SentenceGuesserLevel';
import { buildPuzzle } from './lib/puzzle';

export const SentenceGuesserGame = ({
  level,
  maxLevelNumber,
}: {
  level: SentenceGuesserLevelPayload;
  maxLevelNumber: number;
}) => {
  return (
    <div className='flex flex-col gap-6 py-8'>
      <header className='flex flex-col items-center gap-2'>
        <h1 className='font-serif text-4xl font-bold sm:text-5xl'>
          Gissa meningen
        </h1>
        <p className='max-w-md text-center text-sm text-muted'>
          Lös ledtrådarna. Samma nummer betyder samma bokstav, så varje rätt
          bokstav fylls i överallt.
        </p>
        <nav className='flex items-center gap-4 text-sm'>
          <MkLink
            className={{
              all: 'rounded px-2 py-1 text-accent-800',
              link: 'cursor-pointer',
              span: 'opacity-30',
            }}
            enabled={level.number > 1}
            href={level.number - 1 + ''}
          >
            ← Föregående
          </MkLink>
          <span className='tabular-nums text-muted'>Nivå {level.number}</span>
          <MkLink
            className={{
              all: 'rounded px-2 py-1 text-accent-800',
              link: 'cursor-pointer',
              span: 'opacity-30',
            }}
            enabled={level.number < maxLevelNumber}
            href={level.number + 1 + ''}
          >
            Nästa →
          </MkLink>
        </nav>
      </header>
      <SentenceGuesserLevel
        hasNext={false}
        onNext={() => {}}
        puzzle={buildPuzzle({
          id: level.number + '',
          quote: level.sentence,
          revealed: [],
          clues: level.questions.map((q) => {
            return {
              answer: q.answer,
              clue: q.clue,
              emoji: q.emoji,
            };
          }),
        })}
      />
    </div>
  );
};
