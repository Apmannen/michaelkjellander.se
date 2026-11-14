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
  const awaitedParams = await params;

  const articles = await dbArticles.latest();
  const article = articles.find(
    (a) =>
      a.tags?.at(0)?.slug === awaitedParams.sectionSlug &&
      a.slug === awaitedParams.postSlug,
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
