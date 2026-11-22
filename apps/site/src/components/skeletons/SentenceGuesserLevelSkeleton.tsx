import { Bone } from './Bone';

// Number of letter cells per word in the placeholder sentence.
const sentenceWords = [3, 5, 2, 6, 4, 3, 5];

// Clue text width and number of answer cells per clue row.
const clueRows = [
  { clueWidth: 'w-3/5', cells: 5 },
  { clueWidth: 'w-2/5', cells: 4 },
  { clueWidth: 'w-1/2', cells: 6 },
];

const keyboardRows = [11, 11, 7];

/** A single letter cell placeholder, matching the size of LetterCell. */
const CellBone = () => {
  return (
    <div className='flex w-7 flex-col items-center sm:w-9'>
      <Bone className='h-8 w-full rounded-b-none sm:h-10' />
      <Bone className='mt-1 h-[11px] w-3 sm:h-3' />
    </div>
  );
};

/** Placeholder matching the layout of SentenceGuesserLevel. */
export const SentenceGuesserLevelSkeleton = () => {
  return (
    <div
      role='status'
      aria-label='Laddar nivå'
      className='flex flex-col gap-8'
    >
      {/* Sentence */}
      <div className='flex flex-wrap justify-center gap-x-6 gap-y-5 bg-default-box py-8 border border-accent-200 px-1'>
        {sentenceWords.map((length, i) => (
          <div key={i} className='flex max-w-full gap-1'>
            {Array.from({ length }, (_, j) => (
              <CellBone key={j} />
            ))}
          </div>
        ))}
      </div>

      {/* Clues */}
      <div className='flex flex-col gap-5'>
        {clueRows.map((row, i) => (
          <div key={i} className='border-b pb-8 border-line'>
            <div className='flex items-center gap-3'>
              <Bone className='size-9 shrink-0 sm:size-10' />
              <Bone className={`h-6 sm:h-7 ${row.clueWidth}`} />
            </div>
            <div className='flex gap-1 mt-2'>
              {Array.from({ length: row.cells }, (_, j) => (
                <CellBone key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className='flex items-center justify-between'>
        <Bone className='h-4 w-40' />
        <Bone className='h-4 w-12' />
      </div>

      {/* Keyboard */}
      <div className='flex flex-col gap-1.5 pt-4 pb-4'>
        {keyboardRows.map((length, i) => (
          <div key={i} className='flex justify-center gap-1'>
            {Array.from({ length }, (_, j) => (
              <Bone key={j} className='h-11 max-w-10 flex-1 sm:h-12' />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
