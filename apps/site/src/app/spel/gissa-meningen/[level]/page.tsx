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

  const maxLevel = 35; //TODO: get from DB

  const level = await db.sentenceGuesserLevels({ level: levelNumber });
  if (!level) {
    return notFound();
  }

  return (
    <div className='mx-auto max-w-[640px] px-4 sm:px-8'>
      <SentenceGuesserGame level={level} maxLevelNumber={maxLevel} />
    </div>
  );
};
