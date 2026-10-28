'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useBag } from './Bag';
import { SIZES } from '@/lib/products';

// Size choice + "Add to your Baxaa". Used on product pages and inside the stories, so buying is one step away.
export default function QuickAdd({ slug }: { slug: string }) {
  const [size, setSize] = useState('');
  const [nudge, setNudge] = useState(false);
  const { add } = useBag();

  return (
    <div className="quick-add">
      <fieldset className="sizes">
        <legend className="caps">Size</legend>
        {SIZES.map((s) => (
          <label key={s} className={size === s ? 'on' : ''}>
            <input type="radio" name={`size-${slug}`} value={s} checked={size === s} onChange={() => { setSize(s); setNudge(false); }} />
            {s}
          </label>
        ))}
      </fieldset>
      <AnimatePresence>
        {nudge && (
          <motion.p className="caps nudge" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            Choose your size first
          </motion.p>
        )}
      </AnimatePresence>
      <motion.button className="btn btn-dark" whileTap={{ scale: 0.97 }} onClick={() => (size ? add({ slug, size }) : setNudge(true))}>
        Add to your Baxaa
      </motion.button>
    </div>
  );
}
