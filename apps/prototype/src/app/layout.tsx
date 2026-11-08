import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
});

export const metadata: Metadata = {
  title: {
    default: 'Michael Kjellander',
    template: '%s – Michael Kjellander',
  },
  description: 'Prototyp: spel, recensioner och tankar.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='sv' className={`${serif.variable} h-full antialiased`}>
      <body className='min-h-full font-serif'>
        <div className='mx-auto max-w-[860px] px-4 sm:px-8'>
          <SiteHeader />
          <main className='pb-16'>{children}</main>
        </div>
      </body>
    </html>
  );
}
