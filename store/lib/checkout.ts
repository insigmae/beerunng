'use server';

import { CART_CREATE, shopifyConfigured, storefront } from './shopify';

export type CheckoutResult = { url: string } | { error: 'not-connected' | 'failed'; message?: string };

// Turns the bag into a Shopify cart and returns Shopify's secure checkout URL; payment happens there.
// The bag arrives from the browser, so it is checked here before it reaches Shopify.
export async function checkout(lines: { variantId: string; quantity: number }[]): Promise<CheckoutResult> {
  if (!shopifyConfigured) return { error: 'not-connected' };
  const valid = Array.isArray(lines) && lines.length > 0 && lines.length <= 20 && lines.every((l) =>
    typeof l?.variantId === 'string' && l.variantId.startsWith('gid://shopify/ProductVariant/') &&
    Number.isInteger(l.quantity) && l.quantity >= 1 && l.quantity <= 10);
  if (!valid) return { error: 'failed', message: 'Your bag could not be read. Please add your pieces again.' };

  try {
    const { cartCreate } = await storefront<{ cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } }>(
      CART_CREATE, { input: { lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) } });
    if (!cartCreate.cart) return { error: 'failed', message: cartCreate.userErrors.map((e) => e.message).join(' ') };
    return { url: cartCreate.cart.checkoutUrl };
  } catch (e) {
    console.error('[checkout]', e);
    return { error: 'failed', message: 'Checkout is unavailable right now. Please try again in a moment.' };
  }
}
