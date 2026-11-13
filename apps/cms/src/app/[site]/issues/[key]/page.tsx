import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';
import { parseIssueKey } from '@/lib/issues';

import { IssueDialog } from '@/components/issues/IssueDialog';

async function Dialog({
  params,
}: {
  params: PageProps<'/[site]/issues/[key]'>['params'];
}) {
  const { site, key } = await params;
  const number = parseIssueKey(site, decodeURIComponent(key));
  if (number === undefined) {
    notFound();
  }
  const issue = await db.getIssue(site, number);
  if (!issue) {
    notFound();
  }

  return (
    <IssueDialog
      key={issue.id}
      siteId={site}
      issue={issue}
      columnId={issue.column_id}
    />
  );
}

export default function IssuePage({
  params,
}: PageProps<'/[site]/issues/[key]'>) {
  return (
    <Suspense fallback={null}>
      <Dialog params={params} />
    </Suspense>
  );
}
