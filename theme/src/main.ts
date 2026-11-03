// Beerunng theme scripts (everything except the 3D opening, which is src/intro.tsx).
// Built with `npm run build` into assets/beerunng.js.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { header } from './header';
import { cursor } from './cursor';
import { home } from './home';
import { drape } from './drape';
import { product } from './product';
import { cart } from './cart';

gsap.registerPlugin(ScrollTrigger);

const start = () => { header(); cursor(); cart(); home(); drape(); product(); };
// The page was locked under the opening; re-measure the scroll animations once it has gone.
addEventListener('beerunng:enter', () => setTimeout(() => ScrollTrigger.refresh(), 1000));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
