import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';
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
          <Link
            href='/articles'
            className='text-zinc-600 hover:text-foreground dark:text-zinc-400'
          >
            Artiklar
          </Link>
          <Link
            href='/tags'
            className='text-zinc-600 hover:text-foreground dark:text-zinc-400'
          >
            Taggar
          </Link>
          <Link
            href='/triggers'
            className='text-zinc-600 hover:text-foreground dark:text-zinc-400'
          >
            Triggers
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
