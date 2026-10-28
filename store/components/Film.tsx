'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Drop the brand film into /public (e.g. /public/video/beerunng-film.mp4) and point FILM at it.
// Until then the block plays a slow reel of the two signature campaign images from the deck.
const FILM: string | null = null;
const REEL = [
  { src: '/img/deck-third-rung.jpg', alt: 'The Third Rung: the red turban cloth forming the ३, over the veil collage' },
  { src: '/img/deck-kaanvas.jpg', alt: 'Kaanvas: the ear as a canvas, over the turbaned portrait collage' },
];

export default function Film() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (FILM || !playing) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % REEL.length), 6000);
    return () => clearInterval(t);
  }, [playing]);

  const toggle = () => {
    if (video.current) (playing ? video.current.pause() : video.current.play());
    setPlaying(!playing);
  };

  return (
    <div className={`film${playing ? '' : ' paused'}`}>
      <div className="film-inner">
        {FILM ? (
          <video ref={video} src={FILM} poster={REEL[0].src} autoPlay muted loop playsInline />
        ) : (
          <AnimatePresence initial={false}>
            <motion.img key={frame} src={REEL[frame].src} alt={REEL[frame].alt} className="drift"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.8, ease: 'easeInOut' }} />
          </AnimatePresence>
        )}
      </div>
      <div className="film-bar caps">
        <span>Drop 01 · {frame ? 'Kaanvas' : 'The Third Rung'}</span>
        <a href="#carry">Scroll</a>
        <button onClick={toggle}>{playing ? 'Pause' : 'Play'}</button>
      </div>
    </div>
  );
}
