import gsap from 'gsap';

// The garment between two lights: the lamp projects the cultural reference onto it; daylight shows it plainly.
// Opens on the lamp, then settles partway so you see both at once. Ported from store/components/ProductView.tsx.
export function product() {
  const pdp = document.querySelector<HTMLElement>('[data-pdp]');
  if (!pdp) return;
  const range = pdp.querySelector<HTMLInputElement>('[data-lamp]');
  const glow = pdp.querySelector<HTMLElement>('.stage-glow');

  const setLamp = (lamp: number) => {
    pdp.querySelectorAll<HTMLElement>('.stage-proj').forEach((el) => { el.style.opacity = `${lamp}`; });
    pdp.querySelectorAll<HTMLElement>('.stage-warm').forEach((el) => { el.style.opacity = `${lamp * 0.55}`; });
    if (glow) glow.style.opacity = `${lamp}`;
    if (range) range.value = `${1 - lamp}`;
  };
  if (range) {
    const s = { lamp: 1 };
    setLamp(1);
    gsap.to(s, { lamp: 0.45, duration: 2.4, delay: 0.6, ease: 'power3.inOut', onUpdate: () => setLamp(s.lamp) });
    range.addEventListener('input', () => { gsap.killTweensOf(s); setLamp(1 - Number(range.value)); });
  }

  // Back / front: the garment turns as it swaps.
  pdp.querySelectorAll<HTMLButtonElement>('[data-show]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const side = btn.dataset.show!;
      const next = pdp.querySelector<HTMLElement>(`.stage-layers[data-side="${side}"]`);
      const prev = pdp.querySelector<HTMLElement>('.stage-layers:not([hidden])');
      if (!next || next === prev) return;
      pdp.querySelectorAll('[data-show]').forEach((b) => b.classList.toggle('on', b === btn));
      gsap.to(prev, {
        opacity: 0, rotateY: 25, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
          prev!.hidden = true;
          next.hidden = false;
          gsap.fromTo(next, { opacity: 0, rotateY: -25 }, { opacity: 1, rotateY: 0, duration: 0.55, ease: 'power3.out' });
        },
      });
    }));
}
