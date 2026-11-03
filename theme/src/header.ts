import { onDark } from './tone';

// See-through over the film; anywhere else a bar in the colour of the section beneath, with a hairline.
// Tucks away while scrolling down, comes back on the way up.
export function header() {
  const head = document.querySelector<HTMLElement>('[data-head]');
  if (!head) return;
  let raf = 0, lastY = scrollY;
  const check = () => {
    raf = 0;
    head.classList.toggle('on-dark', onDark(innerWidth / 2, 34));
    const under = document.elementsFromPoint(innerWidth / 2, 34).filter((el) => !el.closest('.site-head'));
    const overBanner = under.some((el) => el.classList.contains('banner'));
    const bg = under.map((el) => getComputedStyle(el).backgroundColor).find((c) => c !== 'rgba(0, 0, 0, 0)');
    head.classList.toggle('solid', !overBanner && !!bg);
    head.style.backgroundColor = !overBanner && bg ? bg : '';
    const y = scrollY;
    if (Math.abs(y - lastY) > 6) { head.classList.toggle('tucked', y > lastY && y > 160); lastY = y; }
  };
  const queue = () => { raf ||= requestAnimationFrame(check); };
  check();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
}
