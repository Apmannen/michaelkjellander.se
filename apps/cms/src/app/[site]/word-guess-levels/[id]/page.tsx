import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { LevelEditor } from '@/components/word-guess/LevelEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/word-guess-levels/[id]'>['params'];
}) {
  const { site, id } = await params;
  const [level, questions] = await Promise.all([
    db.getWordGuessLevel(site, id),
    db.listWordGuessQuestions(site),
  ]);
  if (!level) {
    notFound();
  }

  return (
    <LevelEditor
      key={level.id}
      siteId={site}
      level={level}
      questions={questions}
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
