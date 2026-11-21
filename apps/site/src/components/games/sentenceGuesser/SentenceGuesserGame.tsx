'use client';

import { MkLink } from '@/components/standard/MkLink';
import { SentenceGuesserLevelPayload } from '@/lib/db/payload.types';
import {
  GAME_COMPLETED_EVENT,
  SentenceGuesserLevel,
} from './SentenceGuesserLevel';
import { buildPuzzle } from './lib/puzzle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameStorage, SavedGameData } from './lib/storage';

export const SentenceGuesserGame = ({
  level,
  maxLevelNumber,
}: {
  level: SentenceGuesserLevelPayload;
  maxLevelNumber: number;
}) => {
  const router = useRouter();
  const [savedDatas, setSavedDatas] = useState<SavedGameData[] | undefined>(
    undefined,
  );
  useEffect(() => {
    const updateSavedDatas = () => {
      setSavedDatas(gameStorage.get());
    };
    updateSavedDatas();

    window.addEventListener(GAME_COMPLETED_EVENT, () => {
      updateSavedDatas();
    });
  }, []);
  const savedLevelData = savedDatas?.find(
    (data) => data.level === level.number,
  );

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
          <select
            aria-label='Välj nivå'
            className={`cursor-pointer rounded bg-transparent px-2 py-1 tabular-nums ${savedLevelData?.isDone ? 'text-green-700' : 'text-muted'}`}
            onChange={(e) => {
              router.push(`/spel/gissa-meningen/${e.target.value}`);
            }}
            value={level.number}
          >
            {Array.from({ length: maxLevelNumber }, (_, i) => i + 1).map(
              (number) => {
                const isDone =
                  savedDatas?.find((d) => d.level === number)?.isDone === true;
                return (
                  <option
                    key={number}
                    value={number}
                    className={isDone ? 'text-green-700' : 'text-muted'}
                  >
                    Nivå {number} {isDone ? '✔' : null}
                  </option>
                );
              },
            )}
          </select>
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
      {savedDatas !== undefined ? (
        <SentenceGuesserLevel
          hasNext={false}
          onNext={() => {}}
          puzzle={buildPuzzle({
            id: level.number,
            quote: level.sentence,
            revealed: savedLevelData?.letters || [],
            clues: level.questions.map((q) => {
              return {
                answer: q.answer,
                clue: q.clue,
                emoji: q.emoji,
              };
            }),
          })}
        />
      ) : null}
    </div>
  );
};
