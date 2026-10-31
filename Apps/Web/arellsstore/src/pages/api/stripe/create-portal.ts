import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { resolveAppOrigin } from '../../../lib/auth/origin';
import { getStripe } from '../../../lib/server/stripe';

function sanitizeReturnPath(raw: unknown): string {
  if (typeof raw !== 'string') return '/bitcoin/my-character';
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return '/bitcoin/my-character';
  }
  if (path.length > 200) return '/bitcoin/my-character';
  return path;
}

async function getOrCreateCustomerId(email: string): Promise<string> {
  const stripe = getStripe();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data[0]?.id) return existing.data[0].id;
  const created = await stripe.customers.create({ email });
  return created.id;
}

/**
 * Stripe Customer Portal session (custom domain e.g. billing.arells.com when set in Stripe).
 * Used by Update Character — not bare https://billing.arells.com (no session = stuck loader).
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const returnPath = sanitizeReturnPath(req.body?.returnPath);

  try {
    const origin = resolveAppOrigin(req.headers.origin, req.body?.origin, {
      host: req.headers.host,
      forwardedHost: req.headers['x-forwarded-host'] as string | undefined,
      forwardedProto: req.headers['x-forwarded-proto'] as string | undefined,
    });
    const customerId = await getOrCreateCustomerId(session.email);
    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}${returnPath}`,
    });
    if (!portal.url) {
      return res.status(500).json({ error: 'Billing portal URL missing' });
    }
    return res.status(200).json({ url: portal.url });
  } catch (err) {
    console.error('create-portal', err);
    const stripeErr = err as { code?: string; message?: string; type?: string };
    if (
      stripeErr?.code === 'more_permissions_required' ||
      /customer_portal_write/i.test(stripeErr?.message || '')
    ) {
      return res.status(403).json({
        error:
          'Stripe API key is missing Customer Portal Write. Enable customer_portal_write on the restricted key in Stripe Dashboard → API keys.',
      });
    }
    return res.status(500).json({ error: 'Could not open billing' });
  }
};

export default handler;
