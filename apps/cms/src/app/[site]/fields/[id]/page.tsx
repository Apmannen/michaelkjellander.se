import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { FieldDefinitionEditor } from '@/components/fields/FieldDefinitionEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/fields/[id]'>['params'];
}) {
  const { site, id } = await params;
  const fields = await db.listFieldDefinitions(site);
  const field = fields.find((other) => other.id === id);
  if (!field) {
    notFound();
  }

  return <FieldDefinitionEditor key={field.id} siteId={site} field={field} />;
}

export default function FieldPage({ params }: PageProps<'/[site]/fields/[id]'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
