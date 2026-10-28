import Link from 'next/link';
import Intro from '@/components/Intro';
import { INTRO_SEEN } from '@/lib/intro';
import HomeMotion from '@/components/HomeMotion';
import ProductCard from '@/components/ProductCard';
import Film from '@/components/Film';
import QuickAdd from '@/components/QuickAdd';
import DrapeGlow from '@/components/DrapeGlow';
import { FONT } from '@/lib/fonts';
import { bySlug, inr, products } from '@/lib/products';

// The homepage reads as one story: hook, what you carry, the name, the symbol, choose yours, the ritual.
const RUNGS = [['01', 'What you carry'], ['02', 'The name'], ['03', 'The drape'], ['04', 'Collection'], ['05', 'The Baxaa']];

// The two signature pieces, told as the people who wear them. Each line lights up as you read past it.
const CHAPTERS = [
  {
    slug: 'the-third-rung',
    title: 'The Third Rung',
    lines: [
      'Somewhere, a dyer pulls a length of red turban cloth into the sun.',
      'His father taught him the fold. His grandfather taught his father.',
      'Somewhere else, you are getting ready for a day that could change everything.',
      'Same red. Same cloth. Two rungs of one ladder.',
    ],
    close: 'This is for the one who carries both.',
    crop: '28% 50%',   // centre on the ३ tee in the collage
  },
  {
    slug: 'kaanvas',
    title: 'Kaanvas',
    lines: [
      'Your grandmother’s jhumka.',
      'The stud you got at nineteen, against everyone’s advice.',
      'The cuff you bought last week, just because.',
      'One ear holds all of it, and nobody asks you to choose.',
    ],
    close: 'A portrait of everything you have been, and everything you are becoming.',
    crop: '74% 50%',   // centre on the Kaanvas tee in the collage
  },
];

// Runs before the intro layer is painted: skip it if it already played this visit, on ?skip-intro, or for
// reduced motion. ?intro replays it.
const gate = `try{var q=location.search;if(!/[?&]intro\\b/.test(q)&&(sessionStorage.getItem('${INTRO_SEEN}')==='1'||/[?&]skip-intro\\b/.test(q)||matchMedia('(prefers-reduced-motion: reduce)').matches))document.documentElement.classList.add('intro-seen')}catch(e){}`;

export default function Home() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: gate }} />
      <Intro font={FONT} />
      <HomeMotion />

      <ol className="ladder caps" aria-hidden="true">
        {RUNGS.map(([n, label]) => <li key={n} data-for={n}><span>{n}</span>{label}</li>)}
      </ol>

      <main>
        {/* The hook: the film, full screen, nothing in its way. */}
        <section className="banner" data-tone="dark">
          <h1 className="sr">Beerunng, an overlap.</h1>
          <div className="banner-media"><Film /></div>
        </section>

        {/* 01: what you carry. The two signature pieces, told as people. */}
        <section id="carry" className="stories" data-rung="01">
          <header className="stories-head">
            <span className="caps"><span className="sq">■</span>01 / What you carry</span>
            <h2 data-rise>What do you carry?</h2>
            <p data-rise>Everyone carries two things: what they were given, and what they chose. These are the two pieces people come back to.</p>
          </header>

          {CHAPTERS.map((c, i) => {
            const p = bySlug(c.slug)!;
            return (
              <article key={c.slug} className={`chapter${i % 2 ? ' flip' : ''}`}>
                <div className="chapter-photo">
                  <img src={p.photo} alt={`${c.title}, from the Beerunng lookbook`} style={{ objectPosition: c.crop }} />
                </div>
                <div className="chapter-copy">
                  <span className="caps muted">Signature piece 0{i + 1}</span>
                  <h3 className="chapter-name" data-rise>{c.title}</h3>
                  <div className="chapter-lines">
                    {c.lines.map((l) => <p key={l} className="line">{l}</p>)}
                    <p className="line chapter-close">{c.close}</p>
                  </div>
                  <div className="chapter-buy">
                    <div className="chapter-price">
                      <span className="caps muted">{p.line} · {p.colour}</span>
                      <span>{inr(p.price)}</span>
                    </div>
                    <QuickAdd slug={p.slug} />
                    <Link href={`/product/${p.slug}`} className="caps cta"><span className="cta-line" />See the piece</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* 02: why the name. */}
        <section className="rung name" data-rung="02" data-tone="dark">
          <div className="rung-head">
            <span className="rung-line" />
            <span className="caps">02 / The name</span>
          </div>
          {/* The name as an equation: rang + rungs = Beerunng */}
          <div className="name-grid">
            <div data-rise>
              <span className="caps muted" lang="hi">रंग</span>
              <h2>rang</h2>
              <p>colour: culture, emotion and expression across many Indian languages.</p>
            </div>
            <span className="name-op" aria-hidden="true">+</span>
            <div data-rise>
              <span className="caps muted">steps</span>
              <h2>rungs</h2>
              <p>the steps through which we move, change and progress.</p>
            </div>
            <span className="name-op" aria-hidden="true">=</span>
            <div data-rise>
              <span className="caps muted">the name</span>
              <h2>Beerunng</h2>
              <p>everyone with their own path, their own rung.</p>
            </div>
          </div>
          <p className="name-note" data-rise>A familiar object can become a graphic. A traditional technique can become a detail. A memory can find a new form.</p>
        </section>

        {/* 03: the drape, from the coming-soon page. Matte Beige: a cultural story. */}
        <section id="story" className="drape" data-rung="03">
          <DrapeGlow />
          <div className="drape-copy">
            <span className="caps">03 / The drape</span>
            <h2 data-rise>One length of cloth.</h2>
            <p data-rise>From the hands that dye it to the shoulders that carry it. The same red runs through every rung, and it bends the way a ३ does.</p>
            <p className="caps drape-hint" data-rise><span className="pip" aria-hidden="true" />Trace the drape. Let it catch the light.</p>
          </div>
        </section>

        {/* 04: choose yours. */}
        <section id="collection" className="rung collection" data-rung="04">
          <div className="rung-head">
            <span className="rung-line" />
            <span className="caps">04 / The collection</span>
          </div>
          <h2 data-rise>Not entirely traditional.<br />Not entirely modern.<br />Entirely yours.</h2>
          <div className="grid">
            {products.map((p, i) => <ProductCard key={p.slug} p={p} n={i + 1} />)}
          </div>
        </section>

        {/* 05: the ritual. Matte Beige: process. */}
        <section className="baxaa" data-rung="05">
          <div className="baxaa-img" data-rise><img src="/img/baxaa-open.png" alt="The Baxaa box, open, printed inside with Embracing Rungs" /></div>
          <div className="baxaa-copy">
            <span className="caps">05 / The Baxaa</span>
            <h2 data-rise>Embracing Rungs.</h2>
            <p data-rise>Plain on the outside, meaningful within. Every piece arrives in the Baxaa, and every unboxing is a small ritual of owning your rung.</p>
            <a href="#collection" className="caps cta" data-rise><span className="cta-line" />Find your rung</a>
          </div>
        </section>
      </main>
    </>
  );
}
