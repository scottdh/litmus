import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Instrument_Sans, Newsreader } from 'next/font/google';
import './globals.css';

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument-sans' });
const story = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' });

export const metadata: Metadata = { title: 'Litmus' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${story.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
