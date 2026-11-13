import { Suspense } from 'react';

import { db } from '@/lib/db';

import { TagEditor } from '@/components/tags/TagEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/tags/new'>['params'];
}) {
  const { site } = await params;
  const tags = await db.listTags(site);
  return <TagEditor siteId={site} tags={tags} />;
}

export default function NewTagPage({ params }: PageProps<'/[site]/tags/new'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
