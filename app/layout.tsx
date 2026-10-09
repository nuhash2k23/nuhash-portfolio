import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { site } from '@/lib/content';
import SmoothScroll from '@/components/chrome/SmoothScroll';
import Cursor from '@/components/chrome/Cursor';
import Nav from '@/components/chrome/Nav';
import SoundToggle from '@/components/chrome/SoundToggle';
import './globals.css';

const sans = Inter_Tight({ subsets: ['latin'], variable: '--f-sans', display: 'swap' });
// "90s italic" placeholder — swap for your chosen face (e.g. a local font via next/font/local)
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--f-serif', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--f-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: site.url,
    title: site.title,
    description: site.description,
    siteName: site.name,
    locale: 'en_US',
    // og:image is generated automatically by app/opengraph-image.tsx
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
  robots: { index: true, follow: true },
  // Icons come from file conventions: app/icon.svg (crisp favicon) +
  // app/apple-icon.tsx (iOS home-screen PNG). No manual override here.
};

export const viewport: Viewport = {
  themeColor: '#0a0706',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll />
        <Cursor />
        <Nav />
        <SoundToggle />
        {children}
      </body>
    </html>
  );
}