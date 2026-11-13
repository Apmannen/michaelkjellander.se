import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';

// Shows the not found page for sites that don't exist.
async function SiteGuard({
  params,
}: {
  params: LayoutProps<'/[site]'>['params'];
}) {
  const { site } = await params;
  if (!(await db.getSite(site))) {
    notFound();
  }
  return null;
}

export default function SiteLayout({
  children,
  params,
}: LayoutProps<'/[site]'>) {
  return (
    <>
      <Suspense fallback={null}>
        <SiteGuard params={params} />
      </Suspense>
      {children}
    </>
  );
}
