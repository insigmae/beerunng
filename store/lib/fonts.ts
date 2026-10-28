import { Jost } from 'next/font/google';

// Brand face is Century Gothic Paneuropean (used when installed). Jost is the closest free geometric
// face with a true Bold, loaded for everyone else. Swap in licensed web-font files when available.
export const jost = Jost({ subsets: ['latin'], weight: ['400', '700'], display: 'swap' });
export const FONT = `"Century Gothic Paneuropean", "Century Gothic", CenturyGothic, ${jost.style.fontFamily}`;
