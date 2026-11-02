// Shopify Storefront API (headless): Shopify holds products, stock, carts and checkout; this site is the front end.
// Server-only: the token is read from the environment and never sent to the browser.
// Set in store/.env.local (and in the Vercel project's Environment Variables):
//   SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
//   SHOPIFY_STOREFRONT_TOKEN=<Storefront API access token from Shopify's Headless channel>
// Import this only from server code (lib/catalog.ts, lib/checkout.ts): process.env values without NEXT_PUBLIC_
// are not available in the browser anyway, so a client import would simply find Shopify "not configured".

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const version = process.env.SHOPIFY_API_VERSION ?? '2026-10';

export const shopifyConfigured = Boolean(domain && token);

export async function storefront<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token! },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(`Shopify: ${json.errors.map((e) => e.message).join('; ')}`);
  return json.data!;
}

export type ShopifyProduct = {
  handle: string;
  title: string;
  description: string;
  productType: string;
  priceRange: { minVariantPrice: { amount: string } };
  images: { nodes: { url: string; altText: string | null }[] };
  options: { name: string; values: string[] }[];
  variants: { nodes: { id: string; title: string; availableForSale: boolean; selectedOptions: { name: string; value: string }[] }[] };
};

export const PRODUCTS_QUERY = `
query Products {
  products(first: 50, sortKey: CREATED_AT) {
    nodes {
      handle title description productType
      priceRange { minVariantPrice { amount } }
      images(first: 6) { nodes { url altText } }
      options { name values }
      variants(first: 30) { nodes { id title availableForSale selectedOptions { name value } } }
    }
  }
}`;

export const CART_CREATE = `
mutation CartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { checkoutUrl }
    userErrors { message }
  }
}`;
