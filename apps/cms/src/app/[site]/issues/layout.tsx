import { Suspense } from 'react';

import { db } from '@/lib/db';

import { Board } from '@/components/issues/Board';

async function SiteBoard({
  params,
}: {
  params: LayoutProps<'/[site]/issues'>['params'];
}) {
  const { site } = await params;
  const board = await db.getBoard(site);
  return <Board siteId={site} board={board} />;
}

// The board stays while issues are opened over it, see IssueDialog.
export default function IssuesLayout({
  children,
  params,
}: LayoutProps<'/[site]/issues'>) {
  return (
    <main className='flex min-h-0 flex-1 flex-col'>
      <Suspense
        fallback={<p className='px-6 py-3 text-sm text-zinc-500'>Laddar…</p>}
      >
        <SiteBoard params={params} />
      </Suspense>
      {children}
    </main>
  );
}
