import type { NextApiRequest, NextApiResponse } from 'next';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import { attachReferrerOnRegister, mergeAuthPreservingReferral } from '../../../lib/auth/referral';
import { googleClientId, verifyGoogleIdToken } from '../../../lib/auth/googleIdToken';
import { getUserAuthByEmail, putUserAuth } from '../../../lib/auth/s3UserAuth';
import {
  authSecretConfigured,
  buildSessionCookie,
  signSessionEmail,
} from '../../../lib/auth/session';
import { ensureUserVavityAggregateExists } from '../../../lib/vavity/ensureUserVavityAggregate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authSecretConfigured()) {
    return res.status(503).json({ error: 'Server auth is not configured.', code: 'AUTH_CONFIG' });
  }

  if (!googleClientId()) {
    return res.status(503).json({ error: 'Google sign-in is not configured.', code: 'GOOGLE_CONFIG' });
  }

  const credential =
    typeof req.body?.credential === 'string' ? req.body.credential.trim() : '';
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential.', code: 'INVALID_BODY' });
  }
  const referralCode =
    typeof req.body?.referralCode === 'string' ? req.body.referralCode : undefined;

  try {
    const claims = await verifyGoogleIdToken(credential);
    if (!claims) {
      return res.status(401).json({ error: 'Invalid Google sign-in.', code: 'BAD_TOKEN' });
    }
    if (!claims.emailVerified) {
      return res.status(401).json({
        error: 'Google email is not verified.',
        code: 'EMAIL_UNVERIFIED',
      });
    }

    const email = normalizeEmail(claims.email);
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' });
    }

    const now = Date.now();
    const existing = await getUserAuthByEmail(email);
    const googleProvider = { sub: claims.sub, linkedAt: now };

    if (existing) {
      await putUserAuth(
        email,
        mergeAuthPreservingReferral(existing, {
          ...existing,
          email,
          verified: true,
          verificationToken: undefined,
          verificationExpiresAt: undefined,
          providers: {
            ...existing.providers,
            google: existing.providers?.google?.sub === claims.sub
              ? existing.providers.google
              : googleProvider,
          },
          updatedAt: now,
        })
      );
      await ensureUserVavityAggregateExists(email);
    } else {
      await putUserAuth(email, {
        email,
        verified: true,
        providers: { google: googleProvider },
        updatedAt: now,
      });
      await attachReferrerOnRegister(email, referralCode);
      await ensureUserVavityAggregateExists(email);
    }

    const sessionToken = await signSessionEmail(email);
    if (!sessionToken) {
      return res.status(503).json({ error: 'Could not create session.', code: 'AUTH_CONFIG' });
    }

    res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, 14 * 24 * 60 * 60));
    return res.status(200).json({
      ok: true,
      email,
      created: !existing,
      linked: Boolean(existing),
    });
  } catch (e) {
    console.error('[auth] google error:', e);
    return res.status(500).json({ error: 'Google sign-in failed' });
  }
}
