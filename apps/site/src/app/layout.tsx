import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'Michael Kjellander',
  description: 'Min personliga hemsida',
};

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-source-serif-single',
});

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='sv' className={`${sourceSerif.variable} h-full antialiased `}>
      {/* TODO: remove */}
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com'></link>
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        ></link>
        <link
          href='https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap'
          rel='stylesheet'
        ></link>
      </head>
      <body className={`min-h-full font-source-serif`}>{children}</body>
    </html>
  );
}
