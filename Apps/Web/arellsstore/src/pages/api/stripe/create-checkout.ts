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

/** If Stripe still returns checkout.stripe.com, map to your Checkout custom domain. */
function rewriteCheckoutToCustomDomain(url: string): string {
  const raw =
    process.env.STRIPE_CHECKOUT_CUSTOM_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_DOMAIN?.trim() ||
    'billing.arells.com';
  const host = raw.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  if (!host) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'checkout.stripe.com') {
      parsed.protocol = 'https:';
      parsed.hostname = host;
      return parsed.toString();
    }
  } catch {
    /* keep original */
  }
  return url;
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

    // Do NOT enable managed_payments here — Stripe custom domains (billing.arells.com)
    // are unsupported with Managed Payments and force checkout.stripe.com URLs.
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
      success_url: `${origin}${successPath}${successJoin}cg_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}${cancelJoin}cg_checkout=cancel`,
    });

    if (!checkout.url) {
      return res.status(500).json({ error: 'Checkout session missing URL' });
    }

    await attachCheckoutSession(session.email, credit.creditId, checkout.id);

    const checkoutUrl = rewriteCheckoutToCustomDomain(checkout.url);

    return res.status(200).json({
      alreadyPaid: false,
      creditId: credit.creditId,
      url: checkoutUrl,
      sessionId: checkout.id,
    });
  } catch (err) {
    console.error('create-checkout', err);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
};

export default handler;
