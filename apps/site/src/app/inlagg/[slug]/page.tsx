import 'server-only';

import { dbArticles } from '@/lib/db/articles';
import { Article } from '@/components/Article';
import { MainShell } from '@/components/shells/MainShell';
import { notFound } from 'next/navigation';

//TODO: temporary?
export const instant = false;

export default async function Page({params}: {params: Promise<{ slug: string }>}) {
  const awaitedParams = await params;

   //TODO: change
   //TODO: include tag-slug in url
  const articles = await dbArticles.latest();
  const article = articles.find((a) => a.slug === awaitedParams.slug);
  if(!article) {
    return notFound();
  }

  return (
    <MainShell>
      <Article article={article} isMain={false} />
    </MainShell>
  );
}
