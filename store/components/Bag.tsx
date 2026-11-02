'use client';

import { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { inr } from '@/lib/products';
import { checkout } from '@/lib/checkout';

// What the bag needs to show a piece and check it out; variantId is the Shopify size variant (absent in the sample catalogue).
type Item = { slug: string; size: string; variantId?: string; name: string; price: number; image: string };
type Bag = { items: Item[]; add: (i: Item) => void; open: boolean; setOpen: (o: boolean) => void };

const Ctx = createContext<Bag>(null!);
export const useBag = () => useContext(Ctx);

// ponytail: bag lives in memory until checkout (lost on reload). Keep it in localStorage or a Shopify cart id if that matters.
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
  const [opened, setOpened] = useState<'' | 'leaving' | 'draft'>('');   // the box opens on the way to checkout
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items.reduce((t, i) => t + i.price, 0);

  // Open the box: "Embracing Rungs." for a moment, then on to Shopify's secure checkout to pay.
  const go = async () => {
    setError('');
    if (items.some((i) => !i.variantId)) return setOpened('draft');      // sample catalogue: no store connected yet
    const qty = new Map<string, number>();
    for (const i of items) qty.set(i.variantId!, (qty.get(i.variantId!) ?? 0) + 1);
    setBusy(true);
    const r = await checkout([...qty].map(([variantId, quantity]) => ({ variantId, quantity })));
    setBusy(false);
    if ('url' in r) { setOpened('leaving'); setTimeout(() => location.assign(r.url), 1400); }
    else if (r.error === 'not-connected') setOpened('draft');
    else setError(r.message ?? 'Checkout is unavailable right now.');
  };

  return (
    <AnimatePresence onExitComplete={() => setOpened('')}>
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
                <p className="caps muted" role="status">
                  {opened === 'leaving' ? 'Taking you to secure checkout…' : 'Checkout opens when the store is connected.'}
                </p>
              </motion.div>
            ) : items.length === 0 ? (
              <p className="bag-empty">Your box is empty. Find your rung in the collection.</p>
            ) : (
              <>
                <ul className="bag-items">
                  <AnimatePresence initial={false}>
                    {items.map((it, n) => (
                      <motion.li key={`${it.slug}-${it.size}-${n}`} layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.45, ease }}>
                        <img src={it.image} alt="" />
                        <div>
                          <strong>{it.name}</strong>
                          <span className="caps muted">Size {it.size}</span>
                        </div>
                        <span>{inr(it.price)}</span>
                        <button className="caps link" onClick={() => remove(n)} aria-label={`Remove ${it.name}`}>Remove</button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <footer className="bag-foot">
                  <div className="bag-total"><span className="caps">Subtotal</span><strong>{inr(total)}</strong></div>
                  {error && <p className="caps nudge" role="alert">{error}</p>}
                  <button className="btn btn-dark" onClick={go} disabled={busy}>{busy ? 'Opening the box…' : 'Open the box'}</button>
                  <p className="caps muted bag-note">Shipping and taxes at checkout</p>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
