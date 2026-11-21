import { SentenceGuesserLevel } from '@/lib/db/payload.types';

export const SentenceGuesserGame = ({
  level,
  maxLevelNumber,
}: {
  level: SentenceGuesserLevel;
  maxLevelNumber: number;
}) => {
  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-col items-center gap-2 pt-8'>
        <h1 className='font-serif text-4xl font-bold sm:text-5xl'>
          Gissa meningen
        </h1>
        <p className='max-w-md text-center text-sm text-muted'>
          Lös ledtrådarna. Samma nummer betyder samma bokstav, så varje rätt
          bokstav fylls i överallt.
        </p>
        <nav className='flex items-center gap-4 text-sm'>
          <button
            type='button'
            className='rounded px-2 py-1 cursor-pointer text-accent-800 disabled:opacity-30'
            disabled={level.number <= 1}
          >
            ← Föregående
          </button>
          <span className='tabular-nums text-muted'>Nivå {level.number}</span>
          <button
            type='button'
            className='rounded px-2 py-1 cursor-pointer text-accent-800 disabled:opacity-30'
            disabled={level.number >= maxLevelNumber}
          >
            Nästa →
          </button>
        </nav>
      </header>
    </div>
  );
};
