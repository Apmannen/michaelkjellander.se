import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { ArticleEditor } from '@/components/articles/ArticleEditor';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/articles/[id]'>['params'];
}) {
  const { site, id } = await params;
  const [article, tags, fieldDefinitions, articles] = await Promise.all([
    UUID_PATTERN.test(id) ? db.getArticle(site, id) : undefined,
    db.listTags(site),
    db.listFieldDefinitions(site),
    db.listArticleSummaries(site),
  ]);
  if (!article) {
    notFound();
  }

  return (
    <ArticleEditor
      key={article.id}
      siteId={site}
      article={article}
      tags={tags}
      fieldDefinitions={fieldDefinitions}
      articles={articles}
    />
  );
}

export default function ArticlePage({
  params,
}: PageProps<'/[site]/articles/[id]'>) {
  return (
    <Suspense
      fallback={<p className="px-6 py-3 text-sm text-zinc-500">Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
