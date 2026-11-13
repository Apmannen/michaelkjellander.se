import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';

import { db } from '@/lib/db';

import { SiteMenu } from '@/components/sites/SiteMenu';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kjelle CMS',
};

// The secrets stay on the server, the menu only needs the names.
async function Sites() {
  const sites = await db.listSites();
  return <SiteMenu sites={sites.map(({ id, name }) => ({ id, name }))} />;
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='sv'
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className='h-full flex flex-col'>
        <nav className='flex shrink-0 items-center gap-6 border-b border-zinc-200 px-4 py-2 text-sm dark:border-zinc-800'>
          <Link href='/' className='font-semibold'>
            Kjelle CMS
          </Link>
          <Suspense fallback={null}>
            <Sites />
          </Suspense>
        </nav>
        {children}
      </body>
    </html>
  );
}
