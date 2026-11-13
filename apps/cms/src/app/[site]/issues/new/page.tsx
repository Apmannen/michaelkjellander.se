import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { IssueDialog } from '@/components/issues/IssueDialog';

// ?column= tells which column the issue is added to, or the first one if
// left out.
async function Dialog({
  params,
  searchParams,
}: PageProps<'/[site]/issues/new'>) {
  const { site } = await params;
  const { column: columnId } = await searchParams;
  const { columns } = await db.getBoard(site);
  const column =
    typeof columnId === 'string'
      ? columns.find(({ id }) => id === columnId)
      : columns[0];
  if (!column) {
    notFound();
  }

  return (
    <IssueDialog
      key={column.id}
      siteId={site}
      columnId={column.id}
      columnName={column.name}
    />
  );
}

export default function NewIssuePage(props: PageProps<'/[site]/issues/new'>) {
  return (
    <Suspense fallback={null}>
      <Dialog {...props} />
    </Suspense>
  );
}
