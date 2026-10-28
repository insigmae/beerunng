'use client';

import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography for the home page. Every move is two things settling into one.
export default function HomeMotion() {
  useLayoutEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const html = document.documentElement;
    // Banner entrance: the film opens from a slit at the centre (two halves parting), then its label rises.
    // Plays as the opening fades away, or straight away when the opening is skipped / already seen.
    const enter = () => ctx.add(() =>
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.banner .film-inner', { clipPath: 'inset(0% 49.5% 0% 49.5%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, 0)
        .from('.film-bar', { y: 16, opacity: 0, duration: 1.2 }, 1.2));

    const ctx = gsap.context(() => {
      // Banner: the film drifts slower than the page as you scroll away.
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
        gsap.from(el.querySelector('.rung-line'), {
          scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
        gsap.from(el.querySelectorAll('[data-rise]'), {
          y: 24, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 75%' },
        });
      });

      // Ladder: the side marker follows which rung you're on.
      gsap.utils.toArray<HTMLElement>('[data-rung]').forEach((el) => {
        ScrollTrigger.create({
          trigger: el, start: 'top 50%', end: 'bottom 50%',
          onToggle: (st) => document.querySelector(`.ladder li[data-for="${el.dataset.rung}"]`)?.classList.toggle('on', st.isActive),
        });
      });

      // The drape: it surfaces out of the page as it arrives, no frame to open.
      gsap.fromTo('.drape-art', { opacity: 0, scale: 1.04 }, {
        opacity: 1, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.drape', start: 'top 90%', end: 'top 35%', scrub: 1 },
      });
    });

    if (html.classList.contains('intro-seen')) enter();
    else addEventListener('beerunng:enter', enter, { once: true });
    return () => { removeEventListener('beerunng:enter', enter); ctx.revert(); };
  }, []);
  return null;
}
