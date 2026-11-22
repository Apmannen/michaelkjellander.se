'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Cell, isLetter, Puzzle } from './lib/puzzle';
import { LetterCell } from './LetterCell';
import { Keyboard } from './Keyboard';
import { gameStorage } from './lib/storage';

type Props = {
  puzzle: Puzzle;
  hasNext: boolean;
  onNext: () => void;
};

type WrongGuess = {
  key: string;
  letter: string;
};

const WRONG_FLASH_MS = 600;

export const GAME_COMPLETED_EVENT = 'sensence-guesser-game:completed';

/** Letar upp nästa ruta (i riktningen `step`) vars nummer ännu inte är löst. */
function findUnsolved(
  cells: Cell[],
  solved: Set<number>,
  fromIndex: number,
  step: 1 | -1,
): Cell | undefined {
  for (let i = 1; i <= cells.length; i++) {
    const index =
      (((fromIndex + step * i) % cells.length) + cells.length) % cells.length;
    if (!solved.has(cells[index].number)) {
      return cells[index];
    }
  }
  return undefined;
}

export function SentenceGuesserLevel({ puzzle, hasNext, onNext }: Props) {
  const [solved, setSolved] = useState<Set<number>>(
    () => new Set(puzzle.revealedNumbers),
  );
  const [selectedKey, setSelectedKey] = useState<string | undefined>(
    () =>
      findUnsolved(puzzle.cells, new Set(puzzle.revealedNumbers), -1, 1)?.key,
  );
  const [wrong, setWrong] = useState<WrongGuess | undefined>(undefined);
  const [mistakes, setMistakes] = useState(0);
  const wrongTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(wrongTimer.current);
  }, []);

  const isComplete = solved.size === puzzle.numberCount;
  const selectedIndex = puzzle.cells.findIndex(
    (cell) => cell.key === selectedKey,
  );
  const selectedCell =
    selectedIndex === -1 ? undefined : puzzle.cells[selectedIndex];

  const solveSelected = () => {
    if (!selectedCell) {
      return;
    }
    const next = new Set(solved);
    next.add(selectedCell.number);
    setSolved(next);
    setWrong(undefined);
    setSelectedKey(findUnsolved(puzzle.cells, next, selectedIndex, 1)?.key);
  };

  const enterLetter = (letter: string) => {
    if (!selectedCell || isComplete) {
      return;
    }
    if (letter === selectedCell.letter) {
      solveSelected();
      return;
    }
    setMistakes((count) => count + 1);
    setWrong({ key: selectedCell.key, letter });
    window.clearTimeout(wrongTimer.current);
    wrongTimer.current = window.setTimeout(
      () => setWrong(undefined),
      WRONG_FLASH_MS,
    );
  };

  const moveSelection = (step: 1 | -1) => {
    setSelectedKey(
      findUnsolved(puzzle.cells, solved, selectedIndex, step)?.key ??
        selectedKey,
    );
  };

  const selectCell = (cell: Cell) => {
    if (!solved.has(cell.number)) {
      setSelectedKey(cell.key);
    }
  };

  const selectRow = (cells: Cell[]) => {
    const firstUnsolved = cells.find((cell) => !solved.has(cell.number));
    if (firstUnsolved) {
      setSelectedKey(firstUnsolved.key);
    }
  };

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const key = event.key.toUpperCase();
    if (isLetter(key)) {
      event.preventDefault();
      enterLetter(key);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
    }
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const letters = new Set<string>();
    solved.forEach((number) => {
      puzzle.cells.forEach((cell) => {
        if (cell.number === number) {
          letters.add(cell.letter);
        }
      });
    });
    gameStorage.save({
      isDone: isComplete,
      letters: Array.from(letters),
      level: puzzle.id,
    });
  }, [solved, puzzle.cells, isComplete]);
  useEffect(() => {
    const event = new Event(GAME_COMPLETED_EVENT);
    window.dispatchEvent(event);
  }, [isComplete]);

  const renderCell = (cell: Cell) => (
    <LetterCell
      key={cell.key}
      cell={cell}
      solved={solved.has(cell.number)}
      selected={cell.key === selectedKey}
      related={
        selectedCell !== undefined && cell.number === selectedCell.number
      }
      wrongLetter={wrong?.key === cell.key ? wrong.letter : undefined}
      onSelect={selectCell}
    />
  );

  return (
    <div className='flex flex-col gap-8'>
      <section
        aria-label='Meningen'
        className='flex flex-wrap justify-center gap-x-6 gap-y-5'
      >
        {puzzle.quoteWords.map((word, index) => (
          <div key={index} className='flex max-w-full gap-1'>
            {word.map(renderCell)}
          </div>
        ))}
      </section>

      <section aria-label='Ledtrådar' className='flex flex-col gap-5'>
        {puzzle.clueRows.map((row, index) => {
          const rowSolved = row.cells.every((cell) => solved.has(cell.number));
          return (
            <div key={index} className='border-b pb-8 border-line'>
              <button
                type='button'
                onClick={() => selectRow(row.cells)}
                className='flex items-center gap-3 text-left'
              >
                <span className='text-3xl sm:text-4xl' aria-hidden>
                  {row.emoji}
                </span>
                <span
                  className={`text-lg font-semibold sm:text-xl ${rowSolved ? 'text-muted line-through decoration-accent-700/60' : ''}`}
                >
                  {row.clue}
                </span>
              </button>
              <div className='flex gap-1 mt-2'>{row.cells.map(renderCell)}</div>
            </div>
          );
        })}
      </section>

      <div className='flex items-center justify-between text-sm text-muted'>
        <span>
          Löst {solved.size} av {puzzle.numberCount} bokstäver
        </span>
        <span>Fel: {mistakes}</span>
      </div>

      {isComplete ? (
        <div className='rounded-xl bg-default-box p-5 text-center shadow-sm ring-1 ring-line'>
          <p className='text-2xl font-bold'>Snyggt! 🎉</p>
          <p className='mt-2 text-lg text-accent-800'>”{puzzle.quote}”</p>
          <p className='mt-2 text-sm text-muted'>
            {mistakes === 0 ? 'Helt felfritt!' : `Du gjorde ${mistakes} fel.`}
          </p>
          {hasNext && (
            <button
              type='button'
              onClick={onNext}
              className='mt-4 rounded-lg bg-accent-700 px-5 py-2.5 font-semibold text-white active:bg-accent-800'
            >
              Nästa pussel →
            </button>
          )}
        </div>
      ) : (
        <div
          className='sticky bottom-0 -mx-4 px-2 pt-4 pb-4 sm:mx-0 sm:px-0 border-line'
          style={{
            background: `linear-gradient(to bottom, rgba(243,238,232,0), rgba(243,238,232,0.5) 5%, rgba(243,238,232,0.9) 20%, rgba(243,238,232,1) 80%)`,
          }}
        >
          <Keyboard disabled={!selectedCell} onLetter={enterLetter} />
        </div>
      )}
    </div>
  );
}
