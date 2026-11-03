// Writes beerunng-products.csv: the three pieces from the Vercel store, in Shopify's product import format.
// Import in Shopify admin: Products > Import. Photos are fetched by Shopify from the live Vercel site.
// Run: node shopify/make-products-csv.mjs
import { writeFileSync } from 'node:fs';

const IMG = 'https://beerunng-store.vercel.app/img/';
const SIZES = ['S', 'M', 'L', 'XL'];
const products = [
  {
    handle: 'the-third-rung', title: 'The Third Rung', type: 'Statement', price: 2490, colour: 'Off-white',
    images: ['tee-three-front.png', 'tee-three-back.png'],
    story: 'The flowing cloth forms the ३. A craftsman at one end, a man in a suit at the other: two rungs held by the same fabric.',
  },
  {
    handle: 'kaanvas', title: 'Kaanvas', type: 'Statement', price: 2690, colour: 'Earth brown',
    images: ['tee-kaanvas-brown.png'],
    story: 'Traditional piercings beside contemporary ones. Your roots and your own choices, side by side.',
  },
  {
    handle: 'bee-rom', title: 'Bee (ROM)', type: 'Minimal', price: 2290, colour: 'Petrol blue',
    images: ['tee-petrol-front.png', 'tee-petrol-back.png'],
    story: 'A quiet wordmark on the front. On the back, the ३ turns in a circle, always moving.',
  },
];

const cols = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value',
  'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Price', 'Variant Requires Shipping', 'Variant Taxable', 'Image Src', 'Image Position', 'Image Alt Text', 'Status'];
const csv = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

const rows = [cols];
for (const p of products) {
  const lines = Math.max(SIZES.length, p.images.length);
  for (let i = 0; i < lines; i++) {
    const r = Object.fromEntries(cols.map((c) => [c, '']));
    r.Handle = p.handle;
    if (i === 0) {
      Object.assign(r, {
        Title: p.title,
        'Body (HTML)': `<p>${p.story}</p><p>${p.colour}. Oversized fit, 240 GSM cotton, made in India.</p>`,
        Vendor: 'Beerunng', Type: p.type, Tags: `${p.type}, ${p.colour}`, Published: 'TRUE', 'Option1 Name': 'Size', Status: 'active',
      });
    }
    if (i < SIZES.length) {
      Object.assign(r, {
        'Option1 Value': SIZES[i], 'Variant SKU': `${p.handle}-${SIZES[i].toLowerCase()}`, 'Variant Grams': 250,
        // Stock isn't tracked yet (always available); set real quantities in Shopify before taking orders.
        'Variant Inventory Tracker': '', 'Variant Inventory Policy': 'deny', 'Variant Fulfillment Service': 'manual',
        'Variant Price': p.price, 'Variant Requires Shipping': 'TRUE', 'Variant Taxable': 'TRUE',
      });
    }
    if (i < p.images.length) {
      Object.assign(r, { 'Image Src': IMG + p.images[i], 'Image Position': i + 1,
        'Image Alt Text': `${p.title}, ${i === 0 && p.images.length > 1 ? 'front' : 'back'}` });
    }
    rows.push(cols.map((c) => r[c]));
  }
}
writeFileSync(new URL('./beerunng-products.csv', import.meta.url), '﻿' + rows.map((r) => r.map(csv).join(',')).join('\n') + '\n');
console.log(`${products.length} products, ${rows.length - 1} rows`);
