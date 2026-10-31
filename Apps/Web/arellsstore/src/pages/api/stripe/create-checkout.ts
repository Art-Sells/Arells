import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { resolveAppOrigin } from '../../../lib/auth/origin';
import { ensureReferralCodeForUser } from '../../../lib/auth/referral';
import {
  alienPortraitKey,
  normalizeAlienPhotoAsset,
} from '../../../lib/server/alienPhoto';
import { getServerS3 } from '../../../lib/server/awsS3';
import {
  attachCheckoutSession,
  createPendingCredit,
  findPaidUnusedCredit,
} from '../../../lib/server/characterGenerationCredit';
import { s3BucketNameOrThrow } from '../../../lib/server/s3Bucket';
import { getStripe, stripePriceCharacterGenerationOrThrow } from '../../../lib/server/stripe';

function sanitizeReturnPath(raw: unknown): string {
  if (typeof raw !== 'string') return '/bitcoin';
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) return '/bitcoin';
  if (path.length > 200) return '/bitcoin';
  return path;
}

async function userHasPortrait(email: string, assetId: string): Promise<boolean> {
  const s3 = getServerS3();
  try {
    await s3
      .headObject({
        Bucket: s3BucketNameOrThrow(),
        Key: alienPortraitKey(email, assetId),
      })
      .promise();
    return true;
  } catch (err) {
    const e = err as { code?: string; statusCode?: number };
    if (e?.code === 'NotFound' || e?.code === 'NoSuchKey' || e?.statusCode === 404) {
      return false;
    }
    console.error('create-checkout portrait check', err);
    return false;
  }
}

/** After pay: no character → /bitcoin; has character → /bitcoin/my-character/{shareId}. */
async function resolvePostPaymentPath(email: string, assetId: string): Promise<string> {
  const hasPortrait = await userHasPortrait(email, assetId);
  if (!hasPortrait) return '/bitcoin';
  try {
    const shareId = await ensureReferralCodeForUser(email);
    if (shareId) return `/bitcoin/my-character/${shareId}`;
  } catch (err) {
    console.error('create-checkout shareId', err);
  }
  return '/bitcoin/my-character';
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const assetId = normalizeAlienPhotoAsset(req.body?.assetId || req.body?.asset);
  if (!assetId) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  const cancelPath = sanitizeReturnPath(req.body?.returnPath);

  try {
    const existing = await findPaidUnusedCredit(session.email, assetId);
    if (existing) {
      return res.status(200).json({
        alreadyPaid: true,
        creditId: existing.creditId,
        url: null,
      });
    }

    const origin = resolveAppOrigin(req.headers.origin, req.body?.origin, {
      host: req.headers.host,
      forwardedHost: req.headers['x-forwarded-host'] as string | undefined,
      forwardedProto: req.headers['x-forwarded-proto'] as string | undefined,
    });

    const credit = await createPendingCredit({
      email: session.email,
      assetId,
    });

    const successPath = await resolvePostPaymentPath(session.email, assetId);
    const stripe = getStripe();
    const price = stripePriceCharacterGenerationOrThrow();
    const successJoin = successPath.includes('?') ? '&' : '?';
    const cancelJoin = cancelPath.includes('?') ? '&' : '?';

    // Explicit false: account default can keep Managed Payments on (Sold through Link),
    // which Stripe hosts only on checkout.stripe.com — not billing.arells.com.
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price, quantity: 1 }],
      customer_email: session.email,
      client_reference_id: credit.creditId,
      metadata: {
        creditId: credit.creditId,
        email: session.email,
        assetId,
        product: 'character_generation',
        successPath,
      },
      managed_payments: { enabled: false },
      success_url: `${origin}${successPath}${successJoin}cg_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}${cancelJoin}cg_checkout=cancel`,
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);

    if (!checkout.url) {
      return res.status(500).json({ error: 'Checkout session missing URL' });
    }

    await attachCheckoutSession(session.email, credit.creditId, checkout.id);

    // Use Stripe's session.url as-is. With a Ready + switched Checkout custom domain,
    // Stripe returns https://billing.arells.com/c/pay/... — never rewrite the host.
    return res.status(200).json({
      alreadyPaid: false,
      creditId: credit.creditId,
      url: checkout.url,
      sessionId: checkout.id,
    });
  } catch (err) {
    console.error('create-checkout', err);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
};

export default handler;
