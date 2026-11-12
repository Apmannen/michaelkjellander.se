import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { TagEditor } from '../tag-editor';

async function Editor({ params }: { params: PageProps<'/tags/[id]'>['params'] }) {
  const { id } = await params;
  // All tags are needed anyway, for picking parents.
  const tags = await db.listTags();
  const tag = tags.find((other) => other.id === id);
  if (!tag) {
    notFound();
  }

  return <TagEditor key={tag.id} tag={tag} tags={tags} />;
}

export default function TagPage({ params }: PageProps<'/tags/[id]'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
