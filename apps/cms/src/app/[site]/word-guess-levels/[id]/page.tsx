import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';
import { findTakenQuestionIds } from '@/lib/word-guess';

import { LevelEditor } from '@/components/word-guess/LevelEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/word-guess-levels/[id]'>['params'];
}) {
  const { site, id } = await params;
  // All levels are needed anyway, for knowing which questions are taken.
  const [levels, questions] = await Promise.all([
    db.listWordGuessLevels(site),
    db.listWordGuessQuestions(site),
  ]);
  const level = levels.find((other) => other.id === id);
  if (!level) {
    notFound();
  }

  return (
    <LevelEditor
      key={level.id}
      siteId={site}
      level={level}
      questions={questions}
      takenQuestionIds={findTakenQuestionIds(levels, level.id)}
    />
  );
}

export default function WordGuessLevelPage({
  params,
}: PageProps<'/[site]/word-guess-levels/[id]'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
