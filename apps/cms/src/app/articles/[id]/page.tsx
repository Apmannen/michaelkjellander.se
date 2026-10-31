import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { ArticleEditor } from '../article-editor';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Editor({ params }: { params: PageProps<'/articles/[id]'>['params'] }) {
  const { id } = await params;
  const article = UUID_PATTERN.test(id) ? await db.getArticle(id) : null;
  if (!article) notFound();

  return <ArticleEditor key={article.id} article={article} />;
}

export default function ArticlePage({ params }: PageProps<'/articles/[id]'>) {
  return (
    <Suspense
      fallback={<p className="px-6 py-3 text-sm text-zinc-500">Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
