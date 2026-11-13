import { Suspense } from 'react';

import { FieldDefinitionEditor } from '@/components/fields/FieldDefinitionEditor';

async function Editor({
  params,
}: {
  params: PageProps<'/[site]/fields/new'>['params'];
}) {
  const { site } = await params;
  return <FieldDefinitionEditor siteId={site} />;
}

export default function NewFieldPage({
  params,
}: PageProps<'/[site]/fields/new'>) {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor params={params} />
    </Suspense>
  );
}
