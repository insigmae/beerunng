'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { inr, type Product } from '@/lib/products';

const spring = { type: 'spring', stiffness: 160, damping: 22 } as const;

// Reference and reinterpretation share one frame. Hover pulls them apart so you can see the overlap.
export default function ProductCard({ p, n }: { p: Product; n: number }) {
  return (
    <motion.article className="card" initial="rest" animate="rest" whileHover="open" whileFocus="open">
      <Link href={`/product/${p.slug}`} className="card-link">
        <div className="card-frame">
          <motion.img src={p.reference} alt="" className="card-ref"
            variants={{ rest: { x: '0%', opacity: 0.22 }, open: { x: '-14%', opacity: 0.9 } }} transition={spring} />
          <motion.img src={p.back} alt={`${p.name} tee, back`} className="card-tee"
            variants={{ rest: { x: '0%' }, open: { x: '12%' } }} transition={spring} />
          <motion.span className="caps card-tag card-tag-l" variants={{ rest: { opacity: 0, y: 6 }, open: { opacity: 1, y: 0 } }}>Reference</motion.span>
          <motion.span className="caps card-tag card-tag-r" variants={{ rest: { opacity: 0, y: 6 }, open: { opacity: 1, y: 0 } }}>Reinterpretation</motion.span>
        </div>
        <div className="card-info">
          <span className="caps muted">{String(n).padStart(2, '0')} · {p.line}</span>
          <h3>{p.name}</h3>
          <span>{inr(p.price)}</span>
        </div>
      </Link>
    </motion.article>
  );
}
