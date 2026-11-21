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
  sentence: string;
  // In the order they were picked.
  question_ids: string[];
  created_at: string;
  updated_at: string;
};

export type WordGuessLevelInput = Pick<
  WordGuessLevel,
  'sentence' | 'question_ids'
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

export const validateWordGuessLevel = (
  input: WordGuessLevelInput,
): string | undefined => {
  if (!input.sentence) {
    return 'Mening måste anges.';
  }
  return undefined;
};
