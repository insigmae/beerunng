'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useBag } from './Bag';
import { onDark } from '@/lib/tone';

export default function Header() {
  const { items, setOpen } = useBag();
  const [dark, setDark] = useState(true);
  const [solid, setSolid] = useState<string | null>(null);   // the colour of the section beneath, once it's over page content
  const [hidden, setHidden] = useState(false);  // tucked away while scrolling down, back on the way up

  useEffect(() => {
    let raf = 0, lastY = scrollY;
    const check = () => {
      raf = 0;
      setDark(onDark(innerWidth / 2, 34));
      // Over the banner the film shows through; anywhere else the header sits on a bar in the colour of the section beneath.
      const under = document.elementsFromPoint(innerWidth / 2, 34).filter((el) => !el.closest('.site-head'));
      const bg = under.map((el) => getComputedStyle(el).backgroundColor).find((c) => c !== 'rgba(0, 0, 0, 0)');
      setSolid(under.some((el) => el.classList.contains('banner')) ? null : bg ?? null);
      const y = scrollY;
      if (Math.abs(y - lastY) > 6) { setHidden(y > lastY && y > 160); lastY = y; }
    };
    const queue = () => { raf ||= requestAnimationFrame(check); };
    check();
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    return () => { removeEventListener('scroll', queue); removeEventListener('resize', queue); };
  }, []);

  return (
    <header className={`site-head${dark ? ' on-dark' : ''}${solid ? ' solid' : ''}${hidden ? ' tucked' : ''}`}
      style={solid ? { backgroundColor: solid } : undefined}>
      <Link href="/" className="wordmark" aria-label="Beerunng, home" />
      <nav className="caps">
        <Link href="/#collection">Collection</Link>
        <Link href="/#story">Story</Link>
        <button className="bag-btn" onClick={() => setOpen(true)} aria-label={`Bag, ${items.length} items`}>
          <svg viewBox="0 0 20 16" aria-hidden="true"><path d="M1 5h18v10H1zM1 5l3-4h12l3 4M8 5v3h4V5" fill="none" stroke="currentColor" strokeWidth="1" /></svg>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={items.length} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}>
              {items.length}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>
    </header>
  );
}
