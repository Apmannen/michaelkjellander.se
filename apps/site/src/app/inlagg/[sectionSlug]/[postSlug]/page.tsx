import 'server-only';

import { Article } from '@/components/articles/Article';
import { MainShell } from '@/components/shells/MainShell';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

//TODO: temporary?
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ sectionSlug: string; postSlug: string }>;
}) {
  const { sectionSlug, postSlug } = await params;

  const articles = await db.articles({ slug: postSlug });
  const article = articles.find(
    (a) => a.tags?.at(0)?.slug === sectionSlug && a.slug === postSlug,
  );
  if (!article) {
    return notFound();
  }

  return (
    <MainShell>
      <div className='max-w-content mx-auto'>
        <Article article={article} isMain={false} />
      </div>
    </MainShell>
  );
}
