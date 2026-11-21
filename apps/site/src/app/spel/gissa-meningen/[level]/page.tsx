import { SentenceGuesserGame } from '@/components/games/sentenceGuesser/SentenceGuesserGame';
import { ArticleSkeleton } from '@/components/skeletons/ArticleSkeleton';
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
  const { level } = await params;
  

  return <div>nivå: {level}</div>;
};
