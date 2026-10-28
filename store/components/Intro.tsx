'use client';

import dynamic from 'next/dynamic';
import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { IntroState } from './IntroStage';
import { INTRO_SEEN } from '@/lib/intro';

gsap.registerPlugin(ScrollTrigger);
const Stage = dynamic(() => import('./IntroStage'), { ssr: false });

// What the captions say, and over which stretch of the scroll (0..1). Text stays bottom-left, clear of the letters.
const BEATS = [
  { from: 0, to: 0.06, title: '', sub: 'Scroll to begin' },
  { from: 0.09, to: 0.25, title: 'what we inherit.', sub: 'Seen from the lamp, the object is a B.' },
  { from: 0.28, to: 0.43, title: 'what we become.', sub: 'Seen from today, the same object is an R.' },
  { from: 0.46, to: 0.58, title: 'Two letters. One symbol.', sub: 'One object, two shadows.' },
  { from: 0.61, to: 0.74, title: 'Bring the lights together.', sub: 'An overlap hidden in plain sight.' },
  { from: 0.77, to: 0.87, title: 'the third rung.', sub: 'Where two come together to create a new way forward.' },
];

/* The opening is its own layer over the homepage, with its own scroll (like Sanctum's "The Making").
   It plays once per visit; "Enter" or "Enter website" fades it away to the real homepage underneath.
   Whether it shows is decided before first paint by the script in app/page.tsx (html.intro-seen). */
export default function Intro({ font }: { font: string }) {
  const box = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const fill = useRef<HTMLElement>(null);
  const s = useRef<IntroState>({ lamp: 0, mine: 0, lift: 0, cam: 0, dark: 0 }).current;
  const [gone, setGone] = useState(false);
  const [beat, setBeat] = useState(0);
  const [lit, setLit] = useState(false);
  const [end, setEnd] = useState(false);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains('intro-seen')) { setGone(true); return; }
    html.classList.add('intro-on');
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, scroller: box.current, start: 'top top', end: 'bottom bottom', scrub: 1 },
        onUpdate: () => {
          const p = tl.progress();
          fill.current?.style.setProperty('transform', `scaleY(${p})`);
          setBeat(BEATS.findIndex((b) => p >= b.from && p < b.to));
          setLit(p > 0.08 && p < 0.92);   // the room is lit from the lamp until the lights go out: text turns Pine Grove
          setEnd(p > 0.93);
        },
      });
      tl.to(s, { cam: 1, duration: 0.18 }, 0)            // into the lamp's view
        .to(s, { lamp: 1, duration: 0.1 }, 0.06)         // B on the back wall
        .to(s, { cam: 2, duration: 0.16 }, 0.24)         // round to your light's view
        .to(s, { mine: 1, duration: 0.1 }, 0.27)         // R on the side wall
        .to(s, { cam: 3, duration: 0.11 }, 0.45)         // back out: one object, two shadows
        .to(s, { lift: 1, duration: 0.16 }, 0.59)        // both lights rise and meet: the ३ on the floor
        .to(s, { cam: 4, duration: 0.14 }, 0.66)         // overhead
        .to(s, { cam: 5, dark: 1, duration: 0.12 }, 0.86); // lights out: the ३ alone, glowing
    }, root);
    return () => { ctx.revert(); html.classList.remove('intro-on'); };
  }, [s]);

  const enter = () => {
    try { sessionStorage.setItem(INTRO_SEEN, '1'); } catch {}
    dispatchEvent(new Event('beerunng:enter'));       // the homepage starts its own entrance underneath
    gsap.to(box.current, {
      autoAlpha: 0, duration: 0.9, ease: 'power2.inOut',
      onComplete: () => { setGone(true); document.documentElement.classList.remove('intro-on'); ScrollTrigger.refresh(); },
    });
  };

  if (gone) return null;
  const b = BEATS[beat];
  return (
    <div ref={box} className="intro-layer" role="dialog" aria-label="Beerunng: two lights, one shadow">
      <section ref={root} className="intro">
        <div className="intro-stick">
          <Stage font={font} s={s} />
          <div className={`intro-ui${lit ? ' lit' : ''}`}>
            <span className="wordmark intro-logo" role="img" aria-label="Beerunng" />
            <button className="caps intro-skip" onClick={enter}>Enter website <span aria-hidden="true">→</span></button>
            <span className="intro-rail" aria-hidden="true"><i ref={fill} /></span>
            <div className="intro-caption" aria-live="polite">
              <AnimatePresence mode="wait">
                {b && (
                  <motion.div key={beat} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}>
                    {b.title && <p className="intro-title">{b.title}</p>}
                    <p className="caps">{beat === 0 && <span className="pip" aria-hidden="true" />}{b.sub}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {end && (
                <motion.div className="intro-end" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}>
                  <span className="intro-wordmark" role="img" aria-label="Beerunng" />
                  <p className="caps">Presence of yesterday in today.</p>
                  <button className="btn btn-light" onClick={enter}>Enter Beerunng</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
