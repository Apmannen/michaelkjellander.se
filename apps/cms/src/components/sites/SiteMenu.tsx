'use client';

import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { SITE_COOKIE, SITE_SECTIONS, type Site } from '@/lib/sites';

const NEW_SITE = 'new';

// A year, so the cms keeps going to the last site.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// The site picker and the links to the current site's sections, shown in the
// top menu. Switching site keeps the section, e.g. Taggar, but leaves any
// open document, since it belongs to the old site.
export function SiteMenu({ sites }: { sites: Pick<Site, 'id' | 'name'>[] }) {
  const params = useParams<{ site?: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const current = sites.find((site) => site.id === params.site);

  // Remembered for the start page, see src/app/page.tsx.
  useEffect(() => {
    if (!current) {
      return;
    }
    document.cookie = `${SITE_COOKIE}=${encodeURIComponent(current.id)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  }, [current]);

  const switchTo = (id: string) => {
    if (id === NEW_SITE) {
      router.push('/sites/new');
      return;
    }
    const section = SITE_SECTIONS.find(
      ({ path }) => pathname.split('/')[2] === path,
    );
    router.push(section ? `/${id}/${section.path}` : `/${id}`);
  };

  return (
    <>
      <label htmlFor='site-menu' className='sr-only'>
        Sajt
      </label>
      <select
        id='site-menu'
        value={current?.id ?? ''}
        onChange={(event) => switchTo(event.target.value)}
        className='rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900'
      >
        {!current && (
          <option value='' disabled>
            Välj sajt…
          </option>
        )}
        {sites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
        <option value={NEW_SITE}>+ Ny sajt…</option>
      </select>
      {current &&
        SITE_SECTIONS.map((section) => (
          <Link
            key={section.path}
            href={`/${current.id}/${section.path}`}
            className='text-zinc-600 hover:text-foreground dark:text-zinc-400'
          >
            {section.title}
          </Link>
        ))}
    </>
  );
}
