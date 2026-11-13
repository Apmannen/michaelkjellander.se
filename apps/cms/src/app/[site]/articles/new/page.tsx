import { Suspense } from 'react';

import { db } from '@/lib/db';

import { ArticleEditor } from '@/components/articles/ArticleEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/articles/new'>['params'];
}) {
  const { site } = await params;
  const tags = await db.listTags(site);
  return <ArticleEditor siteId={site} article={null} tags={tags} />;
}

export default function NewArticlePage({
  params,
}: PageProps<'/[site]/articles/new'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
