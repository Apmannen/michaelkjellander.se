import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { db } from '@/lib/db';
import { SITE_COOKIE } from '@/lib/sites';

// Goes straight to the last picked site, see SiteMenu. Without one, the site
// is picked in the top menu.
async function Start() {
  const [cookieStore, sites] = await Promise.all([cookies(), db.listSites()]);
  const lastSiteId = cookieStore.get(SITE_COOKIE)?.value;
  if (lastSiteId && sites.some((site) => site.id === lastSiteId)) {
    redirect(`/${lastSiteId}`);
  }

  return (
    <div className='flex flex-col items-center gap-4'>
      <p>
        {sites.length
          ? 'Välj en sajt i menyn eller skapa en ny.'
          : 'Det finns inga sajter än.'}
      </p>
      <Link
        href='/sites/new'
        className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700'
      >
        Skapa sajt
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <main className='flex flex-1 items-center justify-center text-sm text-zinc-500'>
      <Suspense fallback={<p>Laddar…</p>}>
        <Start />
      </Suspense>
    </main>
  );
}
