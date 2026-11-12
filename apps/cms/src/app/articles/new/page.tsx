import { Suspense } from 'react';

import { db } from '@/lib/db';

import { ArticleEditor } from '@/components/articles/article-editor';

async function Editor() {
  const tags = await db.listTags();
  return <ArticleEditor article={null} tags={tags} />;
}

export default function NewArticlePage() {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor />
    </Suspense>
  );
}
