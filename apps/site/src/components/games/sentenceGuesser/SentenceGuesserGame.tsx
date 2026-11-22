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
import { SentenceGuesserLevelSkeleton } from '@/components/skeletons/SentenceGuesserLevelSkeleton';
import { paths } from '@/lib/paths';

export const SentenceGuesserGame = ({
  level,
  maxLevelNumber,
  autoRedirect,
}: {
  level?: SentenceGuesserLevelPayload;
  maxLevelNumber: number;
  autoRedirect?: boolean;
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
  // Incremented on reset so the level component remounts with fresh state.
  const [resetCount, setResetCount] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const clearSavedData = () => {
    gameStorage.clear();
    setSavedDatas([]);
    setResetCount((count) => count + 1);
    setConfirmingReset(false);
    if (level && level.number !== 1) {
      router.replace(paths.gameSentenceGuesser(1));
    }
  };

  const savedLevelData = savedDatas?.find(
    (data) => data.level === level?.number,
  );

  useEffect(() => {
    if (!autoRedirect || savedDatas === undefined) {
      return;
    }
    let highestLevelNum = 1;
    savedDatas.forEach((aLevelData) => {
      if (aLevelData.letters.length && aLevelData.level > highestLevelNum) {
        highestLevelNum = aLevelData.level;
      }
    });
    router.replace(paths.gameSentenceGuesser(highestLevelNum));
  }, [autoRedirect, savedDatas]);

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
        <nav className='flex items-center text-sm w-full'>
          <MkLink
            className={{
              all: 'rounded py-1 text-accent-800 w-35/100',
              link: 'cursor-pointer',
              span: 'opacity-30',
            }}
            enabled={level && level.number > 1}
            href={level ? level.number - 1 + '' : '#'}
          >
            ← Förra
          </MkLink>
          <div className={`flex-1 ${level ? '' : 'invisible'}`}>
            <select
              aria-label='Välj nivå'
              className={` cursor-pointer rounded bg-transparent px-2 py-1 tabular-nums ${savedLevelData?.isDone ? 'text-green-700' : 'text-muted'} w-full text-center`}
              onChange={(e) => {
                router.push(`/spel/gissa-meningen/${e.target.value}`);
              }}
              value={level?.number}
            >
              {Array.from({ length: maxLevelNumber }, (_, i) => i + 1).map(
                (number) => {
                  const isDone =
                    savedDatas?.find((d) => d.level === number)?.isDone ===
                    true;
                  return (
                    <option
                      key={number}
                      value={number}
                      className={isDone ? 'text-green-700' : 'text-muted'}
                    >
                      Nivå {number} {isDone ? '✓' : null}
                    </option>
                  );
                },
              )}
            </select>
          </div>
          <MkLink
            className={{
              all: 'rounded py-1 text-accent-800 w-35/100 text-right',
              link: 'cursor-pointer',
              span: 'opacity-30',
            }}
            enabled={level && level.number < maxLevelNumber}
            href={level ? level.number + 1 + '' : '#'}
          >
            Nästa →
          </MkLink>
        </nav>
      </header>
      {savedDatas !== undefined && level ? (
        <SentenceGuesserLevel
          key={resetCount}
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
            mistakes: savedLevelData?.mistakes || 0,
          })}
        />
      ) : (
        <SentenceGuesserLevelSkeleton />
      )}
      {savedDatas !== undefined ? (
        <footer className='pt-8 text-xs text-muted flex flex-col items-center gap-4'>
          <div className='flex justify-center gap-3'>
            {confirmingReset ? (
              <>
                <span>Rensa alla sparade framsteg, på alla nivåer?</span>
                <button
                  className='cursor-pointer text-red-700 underline'
                  onClick={clearSavedData}
                  type='button'
                >
                  Ja, rensa
                </button>
                <button
                  className='cursor-pointer underline'
                  onClick={() => setConfirmingReset(false)}
                  type='button'
                >
                  Avbryt
                </button>
              </>
            ) : (
              <button
                className='cursor-pointer underline'
                onClick={() => setConfirmingReset(true)}
                type='button'
              >
                Rensa sparad data
              </button>
            )}
          </div>
          {/* TODO: once we have category pages, link to the games page */}
          <MkLink href='/' className={{ link: 'underline hover:no-underline' }}>
            Tillbaka till michaelkjellander.se
          </MkLink>
        </footer>
      ) : undefined}
    </div>
  );
};
