import Stripe from 'stripe';

/** Managed Payments requires preview API (blueprint: 2026-02-25.preview). */
const STRIPE_API_VERSION = '2026-02-25.preview' as Stripe.LatestApiVersion;

let stripeSingleton: Stripe | null = null;

export function stripeSecretKeyOrThrow(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is missing');
  }
  return key;
}

export function stripePriceCharacterGenerationOrThrow(): string {
  const price = process.env.STRIPE_PRICE_CHARACTER_GENERATION?.trim();
  if (!price) {
    throw new Error('STRIPE_PRICE_CHARACTER_GENERATION is missing');
  }
  return price;
}

export function stripeWebhookSecretOrThrow(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is missing');
  }
  return secret;
}

export function getStripe(): Stripe {
  if (stripeSingleton) return stripeSingleton;
  stripeSingleton = new Stripe(stripeSecretKeyOrThrow(), {
    apiVersion: STRIPE_API_VERSION,
  });
  return stripeSingleton;
}
