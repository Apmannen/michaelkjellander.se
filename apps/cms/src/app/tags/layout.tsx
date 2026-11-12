import Link from 'next/link';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { TagList } from './tag-list';

async function Tags() {
  const tags = await db.listTags();
  return <TagList tags={tags} />;
}

export default function TagsLayout({ children }: LayoutProps<'/tags'>) {
  return (
    <div className='flex min-h-0 flex-1'>
      <section className='flex w-72 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800'>
        <header className='flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800'>
          <h2 className='text-sm font-semibold'>Taggar</h2>
          <Link
            href='/tags/new'
            className='rounded-md px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950'
          >
            + Ny
          </Link>
        </header>
        <div className='flex-1 overflow-y-auto'>
          <Suspense
            fallback={<p className='px-4 py-3 text-sm text-zinc-500'>Laddar…</p>}
          >
            <Tags />
          </Suspense>
        </div>
      </section>
      <main className='min-w-0 flex-1'>{children}</main>
    </div>
  );
}
