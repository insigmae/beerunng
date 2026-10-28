import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FONT, jost } from '@/lib/fonts';
import { BagProvider } from '@/components/Bag';
import Header from '@/components/Header';
import Cursor from '@/components/Cursor';

export const metadata: Metadata = {
  title: 'Beerunng — an overlap.',
  description: 'Beerunng exists in the space between what we inherit and what we become.',
  icons: { icon: '/favicon.png' },
};

export const viewport: Viewport = { themeColor: '#223631' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // suppressHydrationWarning: the intro gate script adds `intro-seen` to <html> before React hydrates
    <html lang="en" className={jost.className} style={{ '--font': FONT } as React.CSSProperties} suppressHydrationWarning>
      <body>
        <BagProvider>
          <Header />
          {children}
        </BagProvider>
        <footer className="foot" data-tone="dark">
          <div className="foot-top">
            <p className="foot-line">Presence of yesterday in today.</p>
            {/* plain link: a full load, so the opening plays again */}
            <a href="/?intro" className="caps cta foot-replay"><span className="cta-line" />Watch the opening again</a>
          </div>
          {/* The brand as the bigger picture: the wordmark, edge to edge */}
          <span className="foot-mark" role="img" aria-label="Beerunng" data-rise />

          <div className="foot-row caps">
            <span>beerunng</span>
            <span>an overlap.</span>
            <span>est. 2025</span>
          </div>
        </footer>
        <Cursor />
      </body>
    </html>
  );
}
