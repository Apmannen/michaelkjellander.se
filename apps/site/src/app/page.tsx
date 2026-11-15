import 'server-only';

import { MainShell } from '@/components/shells/MainShell';
import { db } from '@/lib/db';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ArticleCardListSkeleton } from '@/components/skeletons/ArticleCardSkeleton';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <MainShell>
      <div className='max-w-content mx-auto px-4 lg:px-0 mb-12'>
        <h1 className='text-[48px] font-bold leading-none tracking-[-0.03em]'>
          Senaste inläggen
        </h1>
        <h2 className='pt-3 text-[19px] italic text-muted'>
          Min hemsida där jag postar inlägg om lite allt möjligt
        </h2>
        <div className='pt-8 w-full'>
          <Suspense fallback={<ArticleCardListSkeleton />}>
            <SuspensePage />
          </Suspense>
        </div>
      </div>
    </MainShell>
  );
}

const SuspensePage = async () => {
  const articles = await db.articles({});

  return (
    <div className='space-y-4'>
      {articles.map((article, i) => (
        <div key={i}>
          <ArticleCard key={i} article={article} />
        </div>
      ))}
    </div>
  );
};
