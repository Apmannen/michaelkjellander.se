import { Suspense } from 'react';

import { db } from '@/lib/db';

import { TagEditor } from '../tag-editor';

async function Editor() {
  const tags = await db.listTags();
  return <TagEditor tags={tags} />;
}

export default function NewTagPage() {
  return (
    <Suspense
      fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
    >
      <Editor />
    </Suspense>
  );
}
