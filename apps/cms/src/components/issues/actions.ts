'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  type Issue,
  type IssueInput,
  formatIssueKey,
  validateColumnName,
  validateIssue,
} from '@/lib/issues';

export type ActionResult = { ok: true } | { ok: false; error: string };

export type SaveIssueResult =
  | { ok: true; issue: Issue }
  | { ok: false; error: string };

// The board is in the layout, so it's refreshed along with any open issue.
const revalidate = (siteId: string) => {
  revalidatePath(`/${siteId}/issues`, 'layout');
};

// Column names are shown on one line, so line breaks become spaces.
const parseName = (raw: unknown) =>
  String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const parsePosition = (raw: unknown) =>
  Number.isInteger(raw) ? (raw as number) : 0;

export async function createColumn(
  siteId: string,
  rawName: string,
): Promise<ActionResult> {
  await requireUser();

  const name = parseName(rawName);
  const validationError = validateColumnName(name);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { error } = await db.createIssueColumn(siteId, name);
  if (error) {
    console.error('createColumn failed', error);
    return { ok: false, error: 'Kunde inte skapa kolumnen.' };
  }

  revalidate(siteId);
  return { ok: true };
}

export async function renameColumn(
  siteId: string,
  id: string,
  rawName: string,
): Promise<ActionResult> {
  await requireUser();

  const name = parseName(rawName);
  const validationError = validateColumnName(name);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { error } = await db.renameIssueColumn(siteId, id, name);
  if (error) {
    console.error('renameColumn failed', error);
    return { ok: false, error: 'Kunde inte byta namn på kolumnen.' };
  }

  revalidate(siteId);
  return { ok: true };
}

// position is counted among the other columns.
export async function moveColumn(
  siteId: string,
  id: string,
  position: number,
): Promise<ActionResult> {
  await requireUser();

  const { error } = await db.moveIssueColumn(id, parsePosition(position));
  if (error) {
    console.error('moveColumn failed', error);
    return { ok: false, error: 'Kunde inte flytta kolumnen.' };
  }

  revalidate(siteId);
  return { ok: true };
}

export async function deleteColumn(
  siteId: string,
  id: string,
): Promise<ActionResult> {
  await requireUser();

  const { error } = await db.deleteIssueColumn(id);
  if (error) {
    // 23503 = foreign_key_violation, the column still has issues.
    if (error.code === '23503') {
      return {
        ok: false,
        error: 'Kolumnen har ärenden. Flytta eller ta bort dem först.',
      };
    }
    console.error('deleteColumn failed', error);
    return { ok: false, error: 'Kunde inte ta bort kolumnen.' };
  }

  revalidate(siteId);
  return { ok: true };
}

const parseIssue = (raw: IssueInput): IssueInput => ({
  // The title is shown on one line, so line breaks become spaces.
  title: parseName(raw.title),
  // Same line breaks everywhere, and no trailing whitespace.
  text: String(raw.text ?? '')
    .replace(/\r\n?/g, '\n')
    .trimEnd(),
});

// columnId is only used for new issues, which are added last in it.
export async function saveIssue(
  siteId: string,
  id: string | undefined,
  columnId: string,
  raw: IssueInput,
): Promise<SaveIssueResult> {
  await requireUser();

  const input = parseIssue(raw);

  const validationError = validateIssue(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { data, error } = id
    ? await db.updateIssue(siteId, id, input)
    : await db.createIssue(siteId, String(columnId ?? ''), input);

  if (error) {
    // 23503 = foreign_key_violation, raised by create_issue.
    if (error.code === '23503') {
      return { ok: false, error: 'Kolumnen finns inte längre.' };
    }
    console.error('saveIssue failed', error);
    return { ok: false, error: 'Kunde inte spara ärendet.' };
  }

  revalidate(siteId);

  if (!id) {
    redirect(`/${siteId}/issues/${formatIssueKey(siteId, data.number)}`);
  }

  return { ok: true, issue: data };
}

// position is counted among the column's other issues.
export async function moveIssue(
  siteId: string,
  id: string,
  columnId: string,
  position: number,
): Promise<ActionResult> {
  await requireUser();

  const { error } = await db.moveIssue(
    id,
    String(columnId ?? ''),
    parsePosition(position),
  );
  if (error) {
    console.error('moveIssue failed', error);
    return { ok: false, error: 'Kunde inte flytta ärendet.' };
  }

  revalidate(siteId);
  return { ok: true };
}

export async function deleteIssue(
  siteId: string,
  id: string,
): Promise<{ ok: false; error: string }> {
  await requireUser();

  const { error } = await db.deleteIssue(id);

  if (error) {
    console.error('deleteIssue failed', error);
    return { ok: false, error: 'Kunde inte ta bort ärendet.' };
  }

  revalidate(siteId);
  redirect(`/${siteId}/issues`);
}
