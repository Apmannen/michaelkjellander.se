import { SentenceGuesserGame } from '@/components/games/sentenceGuesser/SentenceGuesserGame';
import { ArticleSkeleton } from '@/components/skeletons/ArticleSkeleton';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ level: string }>;
};

export default async function Page({ params }: Props) {
  return (
    <div className='min-h-dvh flex justify-center bg-default-main'>
      <main className='min-h-dvh w-full'>
        {/* <SentenceGuesserGame /> */}
        <Suspense fallback={<ArticleSkeleton />}>
          <SuspensePage params={params} />
        </Suspense>
      </main>
    </div>
  );
}

const SuspensePage = async ({ params }: Props) => {
  const { level: levelStr } = await params;
  const levelNumber = Number(levelStr);
  if (!levelNumber || isNaN(levelNumber)) {
    return notFound();
  }

  const maxLevel = 10; //TODO: get from DB

  const levels = await db.sentenceGuesserLevels({ level: levelNumber });
  console.log('***LEVELS', JSON.stringify(levels, null, 2));

  return <div>nivå: {levelNumber}</div>;
};
