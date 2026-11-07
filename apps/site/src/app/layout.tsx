import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Michael Kjellander',
  description: 'Min personliga hemsida',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='sv' className={`h-full antialiased`}>
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
      <body className={`min-h-full font-noto-serif`}>{children}</body>
    </html>
  );
}
