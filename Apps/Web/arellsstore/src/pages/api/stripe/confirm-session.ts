import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import {
  markCreditPaid,
  markCreditPaidBySession,
} from '../../../lib/server/characterGenerationCredit';
import { getStripe } from '../../../lib/server/stripe';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionId =
    typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
  if (!sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Missing checkout session' });
  }

  try {
    const stripe = getStripe();
    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    const paidOk =
      checkout.payment_status === 'paid' ||
      checkout.payment_status === 'no_payment_required' ||
      checkout.status === 'complete';
    if (!paidOk) {
      return res.status(402).json({
        error: 'Payment not complete',
        payment_status: checkout.payment_status,
        status: checkout.status,
      });
    }

    const metaEmail = (checkout.metadata?.email || '').trim().toLowerCase();
    if (metaEmail && metaEmail !== session.email) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const creditId = checkout.metadata?.creditId;
    const paymentIntentId =
      typeof checkout.payment_intent === 'string'
        ? checkout.payment_intent
        : checkout.payment_intent?.id || null;

    let credit = null;
    if (creditId) {
      credit = await markCreditPaid({
        email: session.email,
        creditId,
        stripeCheckoutSessionId: checkout.id,
        stripePaymentIntentId: paymentIntentId,
      });
    }
    if (!credit) {
      credit = await markCreditPaidBySession(session.email, checkout.id, paymentIntentId);
    }
    if (!credit) {
      return res.status(404).json({ error: 'Credit not found for this payment' });
    }

    return res.status(200).json({
      paid: true,
      creditId: credit.creditId,
      assetId: credit.assetId,
    });
  } catch (err) {
    console.error('confirm-session', err);
    return res.status(500).json({ error: 'Could not confirm payment' });
  }
};

export default handler;
