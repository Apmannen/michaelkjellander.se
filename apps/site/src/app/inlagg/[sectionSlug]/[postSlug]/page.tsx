import 'server-only';

import { Article } from '@/components/articles/Article';
import { MainShell } from '@/components/shells/MainShell';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ArticleSkeleton } from '@/components/skeletons/ArticleSkeleton';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ sectionSlug: string; postSlug: string }>;
};

export default async function Page({ params }: Props) {
  return (
    <MainShell>
      <div className='max-w-content mx-auto'>
        <Suspense fallback={<ArticleSkeleton />}>
          <SuspensePage params={params} />
        </Suspense>
      </div>
    </MainShell>
  );
}

const SuspensePage = async ({ params }: Props) => {
  const { sectionSlug, postSlug } = await params;

  const articles = await db.articles({ slug: postSlug });
  const article = articles.find(
    (a) => a.tags?.at(0)?.slug === sectionSlug && a.slug === postSlug,
  );
  if (!article) {
    return notFound();
  }

  return <Article article={article} isMain={false} />;
};
