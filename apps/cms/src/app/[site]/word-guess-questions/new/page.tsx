import { Suspense } from 'react';

import { QuestionEditor } from '@/components/word-guess/QuestionEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/word-guess-questions/new'>['params'];
}) {
  const { site } = await params;
  return <QuestionEditor siteId={site} />;
}

export default function NewWordGuessQuestionPage({
  params,
}: PageProps<'/[site]/word-guess-questions/new'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
