import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, hover } from 'motion';
import { reduced } from './tone';

// Scroll choreography and small interactions. Every move is two things settling into one.
// Ported from store/components/HomeMotion.tsx, Film.tsx and ProductCard.tsx.
export function home() {
  film();
  cards();
  if (reduced()) return;

  // Banner entrance: the film opens from a slit at the centre (two halves parting), then its label rises.
  // Plays as the opening fades away, or straight away when the opening is skipped / already seen.
  const enter = () =>
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .fromTo('.banner .film-inner', { clipPath: 'inset(0% 49.5% 0% 49.5%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0)
      .from('.film-bar', { y: 16, opacity: 0, duration: 1.2 }, 1.2);
  if (document.querySelector('.banner')) {
    if (document.documentElement.classList.contains('intro-seen')) enter();
    else addEventListener('beerunng:enter', enter, { once: true });
  }

  // Banner: the film drifts slower than the page as you scroll away.
  if (document.querySelector('.banner'))
    gsap.to('.banner .film-inner', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.banner', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.utils.toArray<HTMLElement>('.stories [data-rise], .drape [data-rise], .baxaa [data-rise], .foot [data-rise]').forEach((el) =>
    gsap.from(el, { y: 18, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

  // Stories: each photo opens out as its chapter arrives; each line lights up as you read past it.
  gsap.utils.toArray<HTMLElement>('.chapter').forEach((ch) => {
    gsap.fromTo(ch.querySelector('.chapter-photo'), { clipPath: 'inset(10% 14% 10% 14%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: ch, start: 'top 90%', end: 'top 25%', scrub: 1 },
    });
    gsap.fromTo(ch.querySelector('.chapter-photo img'), { scale: 1.3 }, {
      scale: 1.15, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    ch.querySelectorAll('.line').forEach((line) =>
      gsap.fromTo(line, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 82%', end: 'top 55%', scrub: true },
      }));
  });

  // Rungs: each section's hairline draws across as you reach it.
  gsap.utils.toArray<HTMLElement>('.rung').forEach((el) => {
    const line = el.querySelector('.rung-line');
    if (line) gsap.from(line, { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    const rise = el.querySelectorAll('[data-rise]');
    if (rise.length) gsap.from(rise, { y: 24, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 75%' } });
  });

  // Ladder: the side marker follows which rung you're on.
  gsap.utils.toArray<HTMLElement>('[data-rung]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 50%', end: 'bottom 50%',
      onToggle: (st) => document.querySelector(`.ladder li[data-for="${el.dataset.rung}"]`)?.classList.toggle('on', st.isActive),
    });
  });

  // The drape: it surfaces out of the page as it arrives, no frame to open.
  if (document.querySelector('.drape'))
    gsap.fromTo('.drape-art', { opacity: 0, scale: 1.04 }, {
      opacity: 1, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.drape', start: 'top 90%', end: 'top 35%', scrub: 1 },
    });

  // Images load after layout on Shopify's CDN; re-measure once they're in so the triggers sit right.
  addEventListener('load', () => ScrollTrigger.refresh());
}

// The film block: a slow reel of the two campaign images (or the uploaded film), with Pause/Play.
function film() {
  const root = document.querySelector<HTMLElement>('[data-film]');
  if (!root) return;
  const frames = [...root.querySelectorAll<HTMLImageElement>('[data-frame]')];
  const label = root.querySelector('[data-film-label]');
  const video = root.querySelector('video');
  const toggle = root.querySelector<HTMLButtonElement>('[data-film-toggle]')!;
  let playing = true, i = 0;
  const step = () => {
    if (!playing || frames.length < 2) return;
    const prev = frames[i];
    i = (i + 1) % frames.length;
    const next = frames[i];
    next.hidden = false;
    next.classList.remove('drift'); void next.offsetWidth; next.classList.add('drift');   // restart the slow push-in
    gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'sine.inOut' });
    gsap.to(prev, { opacity: 0, duration: 1.8, ease: 'sine.inOut', onComplete: () => { prev.hidden = true; } });
    if (label) label.textContent = `Drop 01 · ${next.dataset.label}`;
  };
  setInterval(step, 6000);
  toggle.addEventListener('click', () => {
    playing = !playing;
    toggle.textContent = playing ? 'Pause' : 'Play';
    root.classList.toggle('paused', !playing);
    if (video) playing ? video.play() : video.pause();
  });
}

// Product cards: reference and reinterpretation share one frame; hover pulls them apart (springs, as before).
function cards() {
  const spring = { type: 'spring', stiffness: 160, damping: 22 } as const;
  document.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    const ref = card.querySelector('.card-ref'), tee = card.querySelector('.card-tee');
    const tags = card.querySelectorAll('.card-tag');
    if (ref) animate(ref, { opacity: 0.22 }, { duration: 0 });
    animate(tags, { opacity: 0, y: 6 }, { duration: 0 });
    hover(card, () => {
      if (ref) animate(ref, { x: '-14%', opacity: 0.9 }, spring);
      if (tee) animate(tee, { x: '12%' }, spring);
      animate(tags, { opacity: 1, y: 0 }, spring);
      return () => {
        if (ref) animate(ref, { x: '0%', opacity: 0.22 }, spring);
        if (tee) animate(tee, { x: '0%' }, spring);
        animate(tags, { opacity: 0, y: 6 }, spring);
      };
    });
  });
}
