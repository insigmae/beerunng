// Sample catalogue for the first draft. Front end only: no stock, no payments.
export type Product = {
  slug: string;
  name: string;
  line: 'Minimal' | 'Statement';
  price: number;
  colour: string;
  front: string;
  back: string;
  reference: string;      // the cultural source the design reinterprets
  referenceNote: string;
  story: string;
  dark?: boolean;         // dark garment: the projected reference lightens instead of darkening
  photo?: string;         // campaign image (deck artwork until the photoshoot)
};

export const SIZES = ['S', 'M', 'L', 'XL'];

export const products: Product[] = [
  {
    slug: 'the-third-rung',
    name: 'The Third Rung',
    line: 'Statement',
    price: 2490,
    colour: 'Off-white',
    front: '/img/tee-three-front.png',
    back: '/img/tee-three-back.png',
    reference: '/img/cloth-three.png',
    referenceNote: 'A dyer stretching cloth to dry. One length of red, from the hands that make it to the person who wears it.',
    story: 'The flowing cloth forms the ३. A craftsman at one end, a man in a suit at the other: two rungs held by the same fabric.',
    photo: '/img/deck-third-rung.jpg',
  },
  {
    slug: 'kaanvas',
    name: 'Kaanvas',
    line: 'Statement',
    price: 2690,
    colour: 'Earth brown',
    front: '/img/tee-kaanvas-brown.png',
    back: '/img/tee-kaanvas-brown.png',
    reference: '/img/ear-gold.png',
    referenceNote: 'The ear as a canvas: jhumkas, studs and cuffs from different worlds, worn together.',
    story: 'Traditional piercings beside contemporary ones. Your roots and your own choices, side by side.',
    dark: true,
    photo: '/img/deck-kaanvas.jpg',
  },
  {
    slug: 'bee-rom',
    name: 'Bee (ROM)',
    line: 'Minimal',
    price: 2290,
    colour: 'Petrol blue',
    front: '/img/tee-petrol-front.png',
    back: '/img/tee-petrol-back.png',
    reference: '/img/sketch-elements.png',
    referenceNote: 'The first sketches: adornment, script and the ladder, drawn on one page before they became one mark.',
    story: 'A quiet wordmark on the front. On the back, the ३ turns in a circle, always moving.',
  },
];

export const bySlug = (slug: string) => products.find((p) => p.slug === slug);
export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
