import { Suspense } from 'react';

import { db } from '@/lib/db';

import { LevelEditor } from '@/components/word-guess/LevelEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/word-guess-levels/new'>['params'];
}) {
  const { site } = await params;
  const questions = await db.listWordGuessQuestions(site);
  return <LevelEditor siteId={site} questions={questions} />;
}

export default function NewWordGuessLevelPage({
  params,
}: PageProps<'/[site]/word-guess-levels/new'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
