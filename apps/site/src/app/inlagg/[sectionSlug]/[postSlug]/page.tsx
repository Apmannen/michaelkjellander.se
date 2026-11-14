import 'server-only';

import { dbArticles } from '@/lib/db/articles';
import { Article } from '@/components/Article';
import { MainShell } from '@/components/shells/MainShell';
import { notFound } from 'next/navigation';

//TODO: temporary?
export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ sectionSlug: string; postSlug: string }>;
}) {
  const { sectionSlug, postSlug } = await params;

  const articles = await dbArticles.latest({ slug: postSlug });
  const article = articles.find(
    (a) => a.tags?.at(0)?.slug === sectionSlug && a.slug === postSlug,
  );
  if (!article) {
    return notFound();
  }

  return (
    <MainShell>
      <Article article={article} isMain={false} />
    </MainShell>
  );
}
