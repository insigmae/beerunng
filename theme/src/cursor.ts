import gsap from 'gsap';
import { onDark, reduced } from './tone';

// Two lights follow the pointer at different speeds: warm (inherited, slower) and cool (today, quick).
// When the pointer rests they settle into one: the ■ mark.
export function cursor() {
  const root = document.querySelector<HTMLElement>('.cursor');
  if (!root || !matchMedia('(pointer: fine)').matches || reduced()) return;
  const [warm, cool] = root.querySelectorAll<HTMLElement>('.cur');
  document.documentElement.classList.add('own-cursor');
  root.style.opacity = '0';
  // springs approximated with GSAP's smoothing: the warm light lags, the cool one keeps up
  const wx = gsap.quickTo(warm, 'x', { duration: 0.45, ease: 'power3.out' }), wy = gsap.quickTo(warm, 'y', { duration: 0.45, ease: 'power3.out' });
  const cx = gsap.quickTo(cool, 'x', { duration: 0.12, ease: 'power3.out' }), cy = gsap.quickTo(cool, 'y', { duration: 0.12, ease: 'power3.out' });
  // GSAP owns the dots' transform (position + scale), so the settle animation is GSAP too.
  const ease = { duration: 0.35, ease: 'power3.out', overwrite: 'auto' as const };
  let still = false, t: ReturnType<typeof setTimeout>;
  const settle = (s: boolean) => {
    if (s === still) return;
    still = s;
    gsap.to(warm, { borderRadius: s ? '0%' : '50%', scale: s ? 0.8 : 1, ...ease });
    gsap.to(cool, { borderRadius: s ? '0%' : '50%', scale: s ? 0.8 : 1, opacity: s ? 0 : 1, ...ease });
  };
  addEventListener('pointermove', (e) => {
    if (root.style.opacity === '0') { gsap.set([warm, cool], { x: e.clientX, y: e.clientY }); root.style.opacity = '1'; }
    wx(e.clientX); wy(e.clientY); cx(e.clientX); cy(e.clientY);
    settle(false);
    root.classList.toggle('on-dark', onDark(e.clientX, e.clientY));
    clearTimeout(t);
    t = setTimeout(() => settle(true), 420);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { root.style.opacity = '0'; });
}
