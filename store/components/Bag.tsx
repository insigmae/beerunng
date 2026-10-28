'use client';

import { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { bySlug, inr } from '@/lib/products';

type Item = { slug: string; size: string };
type Bag = { items: Item[]; add: (i: Item) => void; open: boolean; setOpen: (o: boolean) => void };

const Ctx = createContext<Bag>(null!);
export const useBag = () => useContext(Ctx);

// ponytail: bag lives in memory only (front-end draft). Persist / hand to a commerce backend at launch.
export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const add = (i: Item) => { setItems((xs) => [...xs, i]); setOpen(true); };
  const remove = (n: number) => setItems((xs) => xs.filter((_, i) => i !== n));

  return (
    <Ctx.Provider value={{ items, add, open, setOpen }}>
      {children}
      <Drawer items={items} remove={remove} open={open} close={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

const ease = [0.2, 0.7, 0.2, 1] as const;

function Drawer({ items, remove, open, close }: { items: Item[]; remove: (n: number) => void; open: boolean; close: () => void }) {
  const [opened, setOpened] = useState(false);   // the box is opened at checkout
  const total = items.reduce((t, i) => t + (bySlug(i.slug)?.price ?? 0), 0);

  return (
    <AnimatePresence onExitComplete={() => setOpened(false)}>
      {open && (
        <>
          <motion.div className="bag-scrim" onClick={close}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} />
          <motion.aside className="bag" role="dialog" aria-label="Your bag"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.7, ease }}>
            <header className="bag-head">
              <span className="caps">Your Baxaa{items.length ? ` · ${items.length}` : ''}</span>
              <button className="caps link" onClick={close}>Close</button>
            </header>

            {opened ? (
              <motion.div className="bag-open" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
                <span className="mark bag-mark" aria-hidden="true" />
                <h2>Embracing Rungs.</h2>
                <p>Every Beerunng order arrives in the Baxaa box, plain outside and meaningful within.</p>
                <p className="caps muted">Checkout opens at launch. This is a first draft.</p>
              </motion.div>
            ) : items.length === 0 ? (
              <p className="bag-empty">Your box is empty. Find your rung in the collection.</p>
            ) : (
              <>
                <ul className="bag-items">
                  <AnimatePresence initial={false}>
                    {items.map((it, n) => {
                      const p = bySlug(it.slug)!;
                      return (
                        <motion.li key={`${it.slug}-${n}`} layout
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.45, ease }}>
                          <img src={p.back} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            <span className="caps muted">{p.colour} · {it.size}</span>
                          </div>
                          <span>{inr(p.price)}</span>
                          <button className="caps link" onClick={() => remove(n)} aria-label={`Remove ${p.name}`}>Remove</button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <footer className="bag-foot">
                  <div className="bag-total"><span className="caps">Subtotal</span><strong>{inr(total)}</strong></div>
                  <button className="btn btn-dark" onClick={() => setOpened(true)}>Open the box</button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
