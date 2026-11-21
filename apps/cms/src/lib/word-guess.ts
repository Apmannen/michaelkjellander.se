// The word guess game. A site has questions, e.g. ☀️ "Inte natt" with the
// answer "dag", and levels that each have a sentence and some of the
// questions.

export type WordGuessQuestion = {
  id: string;
  emoji: string;
  clue: string;
  answer: string;
  created_at: string;
  updated_at: string;
};

export type WordGuessQuestionInput = Pick<
  WordGuessQuestion,
  'emoji' | 'clue' | 'answer'
>;

export type WordGuessLevel = {
  id: string;
  // E.g. 3 for the site's third level. Unique within a site.
  number: number;
  sentence: string;
  // In the order they were picked.
  question_ids: string[];
  created_at: string;
  updated_at: string;
};

export type WordGuessLevelInput = Pick<
  WordGuessLevel,
  'number' | 'sentence' | 'question_ids'
>;

// Everything is shown on one line, so line breaks become spaces.
export const toLine = (value: unknown) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

export const validateWordGuessQuestion = (
  input: WordGuessQuestionInput,
): string | undefined => {
  if (!input.emoji) {
    return 'Emoji måste anges.';
  }
  if (!input.clue) {
    return 'Ledtråd måste anges.';
  }
  if (!input.answer) {
    return 'Svar måste anges.';
  }
  return undefined;
};

// The ids of the questions used by other levels than the one with levelId,
// which therefore can't be picked for it. A question may only be in one
// level.
export const findTakenQuestionIds = (
  levels: WordGuessLevel[],
  levelId?: string,
): Set<string> =>
  new Set(
    levels
      .filter((level) => level.id !== levelId)
      .flatMap((level) => level.question_ids),
  );

// The levels that use the question, which then can't be deleted.
export const findLevelsWithQuestion = (
  levels: WordGuessLevel[],
  questionId: string,
): WordGuessLevel[] =>
  levels.filter((level) => level.question_ids.includes(questionId));

export const describeQuestionInUse = (levels: WordGuessLevel[]): string => {
  const numbers = levels.map((level) => level.number).join(', ');
  return `Frågan används i ${levels.length === 1 ? 'nivå' : 'nivåerna'} ${numbers} och kan inte tas bort.`;
};

// Anything that isn't a whole number is kept as NaN so validateWordGuessLevel
// can point it out.
export const parseLevelNumber = (value: unknown): number => {
  if (value === undefined || value === null || value === '') {
    return Number.NaN;
  }
  const number = Number(value);
  return Number.isInteger(number) ? number : Number.NaN;
};

// The number after the highest one in use, for a new level.
export const findNextLevelNumber = (levels: WordGuessLevel[]): number =>
  Math.max(0, ...levels.map((level) => level.number)) + 1;

export const validateWordGuessLevel = (
  input: WordGuessLevelInput,
): string | undefined => {
  if (!Number.isInteger(input.number) || input.number < 1) {
    return 'Nummer måste vara ett heltal från 1 och uppåt.';
  }
  if (!input.sentence) {
    return 'Mening måste anges.';
  }
  return undefined;
};
