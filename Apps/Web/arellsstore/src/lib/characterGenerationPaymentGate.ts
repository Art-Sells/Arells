/**
 * TEMP: set false to restore Stripe Checkout for Create / Update Character.
 * When true:
 * - Pay modal still shows
 * - Create Character / Update Character skips Stripe and opens Add Photo
 * - Server compose/generate skips paid-credit requirement
 */
export const CHARACTER_GENERATION_PAYMENT_DISABLED = false;
