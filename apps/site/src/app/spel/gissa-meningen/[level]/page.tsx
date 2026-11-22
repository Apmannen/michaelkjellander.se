import { SentenceGuesserGame } from '@/components/games/sentenceGuesser/SentenceGuesserGame';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ level: string }>;
};
const maxLevel = 35; //TODO: get from DB

export default async function Page({ params }: Props) {
  return (
    <div className='min-h-dvh flex justify-center bg-default-main'>
      <main className='min-h-dvh w-full'>
        <Suspense fallback={<SentenceGuesserGame maxLevelNumber={maxLevel} />}>
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
