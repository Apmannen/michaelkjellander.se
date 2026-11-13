import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { SiteEditor } from '@/components/sites/SiteEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/settings'>['params'];
}) {
  const { site: id } = await params;
  const site = await db.getSite(id);
  if (!site) {
    notFound();
  }

  return <SiteEditor key={site.id} site={site} />;
}

export default function SiteSettingsPage({
  params,
}: PageProps<'/[site]/settings'>) {
  return (
    <main className='flex min-h-0 flex-1 flex-col'>
      <Suspense
        fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
      >
        <Editor params={params} />
      </Suspense>
    </main>
  );
}
