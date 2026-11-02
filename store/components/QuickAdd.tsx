'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useBag } from './Bag';
import { SIZES, type Product } from '@/lib/products';

// Size choice + "Add to your Baxaa". Used on product pages and inside the stories, so buying is one step away.
// With Shopify connected, the sizes are the product's variants and sold-out sizes can't be chosen.
export default function QuickAdd({ p }: { p: Product }) {
  const [size, setSize] = useState('');
  const [nudge, setNudge] = useState(false);
  const { add } = useBag();
  const options = p.variants ?? SIZES.map((s) => ({ id: '', size: s, available: true }));
  const soldOut = options.every((o) => !o.available);

  const onAdd = () => {
    const v = options.find((o) => o.size === size);
    if (!v) return setNudge(true);
    add({ slug: p.slug, size, variantId: v.id || undefined, name: p.name, price: p.price, image: p.back });
  };

  return (
    <div className="quick-add">
      <fieldset className="sizes">
        <legend className="caps">Size</legend>
        {options.map((o) => (
          <label key={o.size} className={`${size === o.size ? 'on' : ''}${o.available ? '' : ' out'}`}>
            <input type="radio" name={`size-${p.slug}`} value={o.size} checked={size === o.size} disabled={!o.available}
              onChange={() => { setSize(o.size); setNudge(false); }} />
            {o.size}
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
      <motion.button className="btn btn-dark" whileTap={{ scale: 0.97 }} onClick={onAdd} disabled={soldOut}>
        {soldOut ? 'Sold out' : 'Add to your Baxaa'}
      </motion.button>
    </div>
  );
}
