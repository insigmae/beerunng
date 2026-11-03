// The opening (two lights, one shadow): the same React + Three.js scene as the Vercel store, bundled on its own
// into assets/beerunng-intro.js. layout/theme.liquid only loads it when the opening is going to play.
import { createRoot } from 'react-dom/client';
import Intro from './intro/Intro';

const el = document.getElementById('beerunng-intro');
if (el && !document.documentElement.classList.contains('intro-seen')) {
  el.classList.add('mounted');   // the scene paints its own Pine Grove from here; the cover steps aside
  createRoot(el).render(<Intro font={window.BEERUNNG.font} onGone={() => el.remove()} />);
}
