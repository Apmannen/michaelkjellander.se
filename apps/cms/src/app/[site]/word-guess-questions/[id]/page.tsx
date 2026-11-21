import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { QuestionEditor } from '@/components/word-guess/QuestionEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/word-guess-questions/[id]'>['params'];
}) {
  const { site, id } = await params;
  const questions = await db.listWordGuessQuestions(site);
  const question = questions.find((other) => other.id === id);
  if (!question) {
    notFound();
  }

  return (
    <QuestionEditor key={question.id} siteId={site} question={question} />
  );
}

export default function WordGuessQuestionPage({
  params,
}: PageProps<'/[site]/word-guess-questions/[id]'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
