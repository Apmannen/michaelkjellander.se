'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseIds } from '@/lib/tags';
import {
  type WordGuessLevel,
  type WordGuessLevelInput,
  type WordGuessQuestion,
  type WordGuessQuestionInput,
  describeQuestionInUse,
  findLevelsWithQuestion,
  findTakenQuestionIds,
  parseLevelNumber,
  toLine,
  validateWordGuessLevel,
  validateWordGuessQuestion,
} from '@/lib/word-guess';

export type SaveWordGuessQuestionResult =
  | { ok: true; question: WordGuessQuestion }
  | { ok: false; error: string };

export type SaveWordGuessLevelResult =
  | { ok: true; level: WordGuessLevel }
  | { ok: false; error: string };

const TAKEN_ERROR = 'En eller flera av frågorna används redan i en annan nivå.';
const NUMBER_TAKEN_ERROR = 'Numret används redan av en annan nivå.';
const NUMBER_CONSTRAINT = 'game_word_guess_levels_site_id_number_key';

// The level editors list the questions, so both are refreshed.
const revalidate = (siteId: string) => {
  revalidatePath(`/${siteId}/word-guess-questions`, 'layout');
  revalidatePath(`/${siteId}/word-guess-levels`, 'layout');
};

export async function saveWordGuessQuestion(
  siteId: string,
  id: string | undefined,
  raw: WordGuessQuestionInput,
): Promise<SaveWordGuessQuestionResult> {
  await requireUser();

  const input: WordGuessQuestionInput = {
    emoji: toLine(raw.emoji),
    clue: toLine(raw.clue),
    answer: toLine(raw.answer),
  };

  const validationError = validateWordGuessQuestion(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { data, error } = id
    ? await db.updateWordGuessQuestion(siteId, id, input)
    : await db.createWordGuessQuestion(siteId, input);

  if (error) {
    console.error('saveWordGuessQuestion failed', error);
    return { ok: false, error: 'Kunde inte spara frågan.' };
  }

  revalidate(siteId);

  if (!id) {
    redirect(`/${siteId}/word-guess-questions/${data.id}`);
  }

  return { ok: true, question: data };
}

export async function deleteWordGuessQuestion(
  siteId: string,
  id: string,
): Promise<{ ok: false; error: string }> {
  await requireUser();

  // Checked again here, since a level may have taken the question since the
  // editor was opened.
  const levels = findLevelsWithQuestion(
    await db.listWordGuessLevels(siteId),
    id,
  );
  if (levels.length > 0) {
    return { ok: false, error: describeQuestionInUse(levels) };
  }

  const { error } = await db.deleteWordGuessQuestion(id);

  if (error) {
    console.error('deleteWordGuessQuestion failed', error);
    return { ok: false, error: 'Kunde inte ta bort frågan.' };
  }

  revalidate(siteId);
  redirect(`/${siteId}/word-guess-questions`);
}

export async function saveWordGuessLevel(
  siteId: string,
  id: string | undefined,
  raw: WordGuessLevelInput,
): Promise<SaveWordGuessLevelResult> {
  await requireUser();

  const input: WordGuessLevelInput = {
    number: parseLevelNumber(raw.number),
    sentence: toLine(raw.sentence),
    question_ids: parseIds(raw.question_ids),
  };

  const validationError = validateWordGuessLevel(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Checked again here, since another level may have taken a question or the
  // number since the editor was opened.
  const levels = await db.listWordGuessLevels(siteId);
  if (
    levels.some((level) => level.id !== id && level.number === input.number)
  ) {
    return { ok: false, error: NUMBER_TAKEN_ERROR };
  }
  const taken = findTakenQuestionIds(levels, id);
  if (input.question_ids.some((questionId) => taken.has(questionId))) {
    return { ok: false, error: TAKEN_ERROR };
  }

  const { data, error } = id
    ? await db.updateWordGuessLevel(siteId, id, input)
    : await db.createWordGuessLevel(siteId, input);

  if (error) {
    // 23505 = unique_violation, if two levels take the same number or question
    // at once.
    if (error.code === '23505') {
      return {
        ok: false,
        error: error.message.includes(NUMBER_CONSTRAINT)
          ? NUMBER_TAKEN_ERROR
          : TAKEN_ERROR,
      };
    }
    console.error('saveWordGuessLevel failed', error);
    return { ok: false, error: 'Kunde inte spara nivån.' };
  }

  revalidate(siteId);

  if (!id) {
    redirect(`/${siteId}/word-guess-levels/${data.id}`);
  }

  return { ok: true, level: data };
}

export async function deleteWordGuessLevel(
  siteId: string,
  id: string,
): Promise<{ ok: false; error: string }> {
  await requireUser();

  const { error } = await db.deleteWordGuessLevel(id);

  if (error) {
    console.error('deleteWordGuessLevel failed', error);
    return { ok: false, error: 'Kunde inte ta bort nivån.' };
  }

  revalidate(siteId);
  redirect(`/${siteId}/word-guess-levels`);
}
