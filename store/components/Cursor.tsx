'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { onDark } from '@/lib/tone';

// Two lights follow the pointer at different speeds: warm (inherited) and quick (today).
// When the pointer rests they settle into one: the ■ mark.
export default function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const wx = useSpring(x, { stiffness: 140, damping: 22 }), wy = useSpring(y, { stiffness: 140, damping: 22 });
  const cx = useSpring(x, { stiffness: 700, damping: 40 }), cy = useSpring(y, { stiffness: 700, damping: 40 });
  const [on, setOn] = useState(false);
  const [still, setStill] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('own-cursor');
    let t: ReturnType<typeof setTimeout>;
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY);
      setOn(true); setStill(false);
      setDark(onDark(e.clientX, e.clientY));
      clearTimeout(t);
      t = setTimeout(() => setStill(true), 420);
    };
    const leave = () => setOn(false);
    addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      document.documentElement.classList.remove('own-cursor');
      removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [x, y]);

  const ease = { duration: 0.35, ease: [0.2, 0.7, 0.2, 1] as const };
  return (
    <div className={`cursor${dark ? ' on-dark' : ''}`} aria-hidden="true" style={{ opacity: on ? 1 : 0 }}>
      <motion.span className="cur cur-warm" style={{ x: wx, y: wy }}
        animate={{ borderRadius: still ? '0%' : '50%', scale: still ? 0.8 : 1 }} transition={ease} />
      <motion.span className="cur cur-cool" style={{ x: cx, y: cy }}
        animate={{ borderRadius: still ? '0%' : '50%', scale: still ? 0.8 : 1, opacity: still ? 0 : 1 }} transition={ease} />
    </div>
  );
}
