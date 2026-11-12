import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { ArticleEditor } from '../article-editor';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Editor({ params }: { params: PageProps<'/articles/[id]'>['params'] }) {
  const { id } = await params;
  const [article, tags] = await Promise.all([
    UUID_PATTERN.test(id) ? db.getArticle(id) : undefined,
    db.listTags(),
  ]);
  if (!article) notFound();

  return <ArticleEditor key={article.id} article={article} tags={tags} />;
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
