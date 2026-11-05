import type { NextApiRequest, NextApiResponse } from 'next';
import type Stripe from 'stripe';
import { markCreditPaid } from '../../../lib/server/characterGenerationCredit';
import { getStripe, stripeWebhookSecretOrThrow } from '../../../lib/server/stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecretOrThrow());
  } catch (err) {
    console.error('stripe webhook verify', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const email = (checkout.metadata?.email || checkout.customer_email || '')
        .trim()
        .toLowerCase();
      const creditId = checkout.metadata?.creditId;
      if (email && creditId) {
        const paymentIntentId =
          typeof checkout.payment_intent === 'string'
            ? checkout.payment_intent
            : checkout.payment_intent?.id || null;
        await markCreditPaid({
          email,
          creditId,
          stripeCheckoutSessionId: checkout.id,
          stripePaymentIntentId: paymentIntentId,
        });
      }
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe webhook handle', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};

export default handler;
