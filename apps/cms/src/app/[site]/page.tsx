import Link from 'next/link';
import { Suspense } from 'react';

import { SITE_SECTIONS } from '@/lib/sites';

async function Sections({ params }: { params: PageProps<'/[site]'>['params'] }) {
  const { site } = await params;
  return (
    <ul className='mx-auto flex max-w-2xl flex-col gap-3 px-6 py-8'>
      {SITE_SECTIONS.map((section) => (
        <li key={section.path}>
          <Link
            href={`/${site}/${section.path}`}
            className='flex flex-col gap-0.5 rounded-md border border-zinc-200 px-4 py-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800'
          >
            <span className='text-sm font-semibold'>{section.title}</span>
            <span className='text-xs text-zinc-500'>{section.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function SitePage({ params }: PageProps<'/[site]'>) {
  return (
    <main className='flex-1 overflow-y-auto'>
      <Suspense fallback={null}>
        <Sections params={params} />
      </Suspense>
    </main>
  );
}
