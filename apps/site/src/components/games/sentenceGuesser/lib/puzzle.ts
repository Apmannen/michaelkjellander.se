export type ClueDefinition = {
  emoji: string;
  clue: string;
  answer: string;
};

export type PuzzleDefinition = {
  id: number;
  /** Meningen som ska gissas. Varje unik bokstav får ett nummer i den ordning den först förekommer. */
  quote: string;
  clues: ClueDefinition[];
  /** Bokstäver som är ifyllda från start. */
  revealed: string[];
  mistakes: number;
};

export type Cell = {
  key: string;
  letter: string;
  number: number;
};

export type ClueRow = {
  emoji: string;
  clue: string;
  cells: Cell[];
};

export type Puzzle = {
  id: number;
  quote: string;
  quoteWords: Cell[][];
  clueRows: ClueRow[];
  /** Alla rutor i navigeringsordning: först meningen, sedan ledtrådarna. */
  cells: Cell[];
  revealedNumbers: number[];
  numberCount: number;
  mistakes: number;
};

const LETTER_PATTERN = /^[A-ZÅÄÖ]$/;

export function isLetter(value: string): boolean {
  return LETTER_PATTERN.test(value);
}

export function buildPuzzle(definition: PuzzleDefinition): Puzzle {
  const numberByLetter = new Map<string, number>();

  const quoteWords = definition.quote
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, wordIndex) =>
      [...word].filter(isLetter).map((letter, letterIndex): Cell => {
        let number = numberByLetter.get(letter);
        if (number === undefined) {
          number = numberByLetter.size + 1;
          numberByLetter.set(letter, number);
        }
        return { key: `q-${wordIndex}-${letterIndex}`, letter, number };
      }),
    );

  const numberFor = (letter: string): number => {
    const number = numberByLetter.get(letter);
    if (number === undefined) {
      throw new Error(
        `Pussel "${definition.id}": bokstaven "${letter}" finns inte i meningen.`,
      );
    }
    return number;
  };

  const clueRows = definition.clues.map(
    (clue, rowIndex): ClueRow => ({
      emoji: clue.emoji,
      clue: clue.clue,
      cells: [...clue.answer.toUpperCase()].map((letter, letterIndex) => ({
        key: `c-${rowIndex}-${letterIndex}`,
        letter,
        number: numberFor(letter),
      })),
    }),
  );

  return {
    id: definition.id,
    quote: definition.quote.toUpperCase(),
    quoteWords,
    clueRows,
    cells: [...quoteWords.flat(), ...clueRows.flatMap((row) => row.cells)],
    revealedNumbers: definition.revealed.map((letter) =>
      numberFor(letter.toUpperCase()),
    ),
    numberCount: numberByLetter.size,
    mistakes: definition.mistakes,
  };
}
