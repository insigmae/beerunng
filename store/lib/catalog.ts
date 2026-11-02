import { cacheLife } from 'next/cache';
import { products as editorial, type Product } from './products';
import { PRODUCTS_QUERY, shopifyConfigured, storefront, type ShopifyProduct } from './shopify';

// The live catalogue: Shopify's products (price, sizes, stock, photos) dressed with our editorial layer.
// Cached for a few minutes, so edits in Shopify admin show up shortly without a redeploy.
export async function getProducts(): Promise<Product[]> {
  'use cache';
  cacheLife('minutes');
  if (!shopifyConfigured) return editorial;
  const { products } = await storefront<{ products: { nodes: ShopifyProduct[] } }>(PRODUCTS_QUERY);
  return products.nodes.map(fromShopify);
}

export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug);
}

const option = (p: ShopifyProduct, name: RegExp) => p.options.find((o) => name.test(o.name));

function fromShopify(s: ShopifyProduct): Product {
  const e = editorial.find((p) => p.slug === s.handle);
  const img = s.images.nodes.map((i) => i.url);
  return {
    slug: s.handle,
    name: s.title,
    line: e?.line ?? (/minimal/i.test(s.productType) ? 'Minimal' : 'Statement'),
    price: Math.round(Number(s.priceRange.minVariantPrice.amount)),
    colour: option(s, /colou?r/i)?.values[0] ?? e?.colour ?? '',
    // Shopify photos first (front, then back); our artwork until they're uploaded
    front: img[0] ?? e?.front ?? '',
    back: img[1] ?? img[0] ?? e?.back ?? '',
    reference: e?.reference ?? img[2] ?? img[0] ?? '',
    referenceNote: e?.referenceNote ?? '',
    story: e?.story ?? s.description,
    dark: e?.dark,
    photo: e?.photo ?? img[0],
    variants: s.variants.nodes.map((v) => ({
      id: v.id,
      size: v.selectedOptions.find((o) => /size/i.test(o.name))?.value ?? v.title,
      available: v.availableForSale,
    })),
  };
}
