'use client';

import { useEffect, useState } from 'react';
import { animate, AnimatePresence, motion } from 'motion/react';
import QuickAdd from './QuickAdd';
import { inr, type Product } from '@/lib/products';

const ease = [0.2, 0.7, 0.2, 1] as const;

// The garment stands between two lights. The lamp casts its cultural source onto it;
// daylight shows it plainly, as you'd buy it.
export default function ProductView({ p }: { p: Product }) {
  const [lamp, setLamp] = useState(1);
  const [side, setSide] = useState<'back' | 'front'>('back');

  useEffect(() => {
    // Open on the lamp, then let it settle partway so you see both truths at once.
    const a = animate(1, 0.45, { duration: 2.4, delay: 0.6, ease: [0.6, 0, 0.2, 1], onUpdate: setLamp });
    return () => a.stop();
  }, []);

  const img = side === 'back' ? p.back : p.front;
  const mask = { maskImage: `url(${img})`, WebkitMaskImage: `url(${img})` };

  return (
    <section className="pdp">
      <div className="stage">
        <div className="stage-garment">
          <AnimatePresence mode="wait">
            <motion.div key={img} className="stage-layers" initial={{ opacity: 0, rotateY: -25 }} animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 25 }} transition={{ duration: 0.55, ease }}>
              <img src={img} alt={`${p.name} tee, ${side}`} />
              <div className="stage-proj" style={{ ...mask, opacity: lamp }}>
                <img src={p.reference} alt="" style={{ mixBlendMode: p.dark ? 'screen' : 'multiply' }} />
              </div>
              <div className="stage-warm" style={{ ...mask, opacity: lamp * 0.55 }} />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="stage-glow" style={{ opacity: lamp }} aria-hidden="true" />

        <div className="stage-ctrl">
          <label className="caps" htmlFor="light">
            <span>Lamp · inherited</span>
            <span>Daylight · today</span>
          </label>
          <input id="light" type="range" min={0} max={1} step={0.001} value={1 - lamp}
            onChange={(e) => setLamp(1 - Number(e.target.value))} aria-label="Move the light between lamp and daylight" />
        </div>
        {p.front !== p.back && (
          <div className="stage-sides caps" role="group" aria-label="View">
            {(['back', 'front'] as const).map((s) => (
              <button key={s} className={side === s ? 'on' : ''} onClick={() => setSide(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>

      <div className="pdp-info">
        <span className="caps muted">{p.line} · {p.colour}</span>
        <h1>{p.name}</h1>
        <p className="pdp-price">{inr(p.price)}</p>
        <p>{p.story}</p>

        <QuickAdd slug={p.slug} />
        <p className="caps muted pdp-note">Oversized fit · 240 GSM cotton · Made in India</p>
      </div>
    </section>
  );
}
