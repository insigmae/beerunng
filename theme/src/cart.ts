import { animate } from 'motion';

// The bag: Shopify's real cart (AJAX Cart API) in the Baxaa drawer. It survives reloads because it lives in Shopify.
// "Open the box" shows Embracing Rungs. for a moment, then hands over to Shopify's secure checkout.
// Ported from store/components/Bag.tsx and QuickAdd.tsx.
type Line = { key: string; quantity: number; product_title: string; variant_title: string | null; final_line_price: number; image: string | null };
type Cart = { item_count: number; total_price: number; items: Line[] };

const ease = [0.2, 0.7, 0.2, 1] as const;
const money = (cents: number) => `₹${(cents / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const sized = (src: string, width: number) => { const u = new URL(src, location.href); u.searchParams.set('width', `${width}`); return u.href; };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function cart() {
  const root = document.querySelector<HTMLElement>('[data-bag]');
  if (!root) return;
  const panel = root.querySelector<HTMLElement>('.bag')!, scrim = root.querySelector<HTMLElement>('.bag-scrim')!;
  const body = root.querySelector<HTMLElement>('[data-bag-body]')!, count = root.querySelector('[data-bag-n]')!;
  const B = window.BEERUNNG;

  const json = async (url: string, init?: RequestInit) => {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, ...init });
    const data = await r.json();
    if (!r.ok) throw new Error(data.description || data.message || 'Something went wrong.');
    return data;
  };

  const render = (c: Cart, note = '') => {
    count.textContent = c.item_count ? ` · ${c.item_count}` : '';
    document.querySelectorAll('[data-bag-count]').forEach((el) => { el.textContent = `${c.item_count}`; });
    if (!c.items.length) { body.innerHTML = '<p class="bag-empty">Your box is empty. Find your rung in the collection.</p>'; return; }
    body.innerHTML = `
      <ul class="bag-items">${c.items.map((it) => `
        <li>
          ${it.image ? `<img src="${esc(sized(it.image, 160))}" alt="">` : '<span></span>'}
          <div><strong>${esc(it.product_title)}</strong><span class="caps muted">${it.variant_title ? `Size ${esc(it.variant_title)}` : ''}${it.quantity > 1 ? ` · ${it.quantity}` : ''}</span></div>
          <span>${money(it.final_line_price)}</span>
          <button class="caps link" data-remove="${esc(it.key)}" aria-label="Remove ${esc(it.product_title)}">Remove</button>
        </li>`).join('')}
      </ul>
      <footer class="bag-foot">
        <div class="bag-total"><span class="caps">Subtotal</span><strong>${money(c.total_price)}</strong></div>
        ${note ? `<p class="caps nudge" role="alert">${esc(note)}</p>` : ''}
        <button class="btn btn-dark" data-checkout>Open the box</button>
        <p class="caps muted bag-note">Shipping and taxes at checkout</p>
      </footer>`;
  };
  const refresh = async (note?: string) => render(await json(B.cart), note);

  const open = async () => {
    if (!root.hidden) return;
    root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    animate(scrim, { opacity: [0, 1] }, { duration: 0.4 });
    animate(panel, { x: ['100%', '0%'] }, { duration: 0.7, ease });
    await refresh();
  };
  const close = async () => {
    animate(scrim, { opacity: 0 }, { duration: 0.4 });
    await animate(panel, { x: '100%' }, { duration: 0.7, ease });
    root.hidden = true;
    document.documentElement.style.overflow = '';
  };

  document.querySelectorAll('[data-bag-open]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  root.querySelectorAll('[data-bag-close]').forEach((el) => el.addEventListener('click', close));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !root.hidden) close(); });

  body.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const remove = t.closest<HTMLElement>('[data-remove]');
    if (remove) {
      const li = remove.closest('li')!;
      await animate(li, { opacity: 0, x: 30 }, { duration: 0.35, ease });
      render(await json(B.cartChange, { method: 'POST', body: JSON.stringify({ id: remove.dataset.remove, quantity: 0 }) }));
    }
    if (t.closest('[data-checkout]')) {
      // Open the box: the ritual for a moment, then on to Shopify's secure checkout to pay.
      body.innerHTML = `
        <div class="bag-open">
          <span class="mark bag-mark" aria-hidden="true"></span>
          <h2>Embracing Rungs.</h2>
          <p>Every Beerunng order arrives in the Baxaa box, plain outside and meaningful within.</p>
          <p class="caps muted" role="status">Taking you to secure checkout…</p>
        </div>`;
      animate(body.firstElementChild!, { opacity: [0, 1], y: [12, 0] }, { duration: 0.9, ease });
      setTimeout(() => location.assign(B.checkout), 1400);
    }
  });

  // Quick add (stories and product page): add in place and open the bag, instead of leaving the page.
  document.querySelectorAll<HTMLFormElement>('[data-quick-add]').forEach((form) =>
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = new FormData(form).get('id');
      const nudge = form.querySelector<HTMLElement>('[data-nudge]')!;
      if (!id) { nudge.hidden = false; animate(nudge, { opacity: [0, 1], y: [-4, 0] }, { duration: 0.3 }); return; }
      nudge.hidden = true;
      const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
      animate(btn, { scale: [0.97, 1] }, { duration: 0.3 });
      btn.disabled = true;
      try {
        await json(B.cartAdd, { method: 'POST', body: JSON.stringify({ items: [{ id: Number(id), quantity: 1 }] }) });
        if (root.hidden) await open(); else await refresh();
      } catch (err) {
        await open();
        await refresh((err as Error).message);
      } finally {
        btn.disabled = false;
      }
    }));
  form_sizes();
}

// Picking a size clears the "choose your size" note.
function form_sizes() {
  document.querySelectorAll<HTMLFormElement>('[data-quick-add]').forEach((form) =>
    form.addEventListener('change', () => { const n = form.querySelector<HTMLElement>('[data-nudge]'); if (n) n.hidden = true; }));
}
