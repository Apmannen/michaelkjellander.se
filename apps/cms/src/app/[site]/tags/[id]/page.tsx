import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { TagEditor } from '@/components/tags/TagEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/tags/[id]'>['params'];
}) {
  const { site, id } = await params;
  // All tags are needed anyway, for picking parents.
  const tags = await db.listTags(site);
  const tag = tags.find((other) => other.id === id);
  if (!tag) {
    notFound();
  }

  return <TagEditor key={tag.id} siteId={site} tag={tag} tags={tags} />;
}

export default function TagPage({ params }: PageProps<'/[site]/tags/[id]'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
