import type { Metadata, Viewport } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import './globals.css';

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

export const metadata: Metadata = {
  title: 'Gissa orden',
  description: 'Prototyp: ordpussel där samma nummer betyder samma bokstav.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='sv' className={`${serif.variable} h-full antialiased`}>
      <body className='min-h-full font-sans'>
        <main className='mx-auto max-w-[640px] px-4 sm:px-8'>{children}</main>
      </body>
    </html>
  );
}
