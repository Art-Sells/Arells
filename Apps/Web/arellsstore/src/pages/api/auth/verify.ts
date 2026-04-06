import type { NextApiRequest, NextApiResponse } from 'next';
import {
  deletePendingVerification,
  getPendingVerification,
  getUserAuthByEmail,
  putUserAuth,
} from '../../../lib/auth/s3UserAuth';
import {
  authSecretConfigured,
  buildSessionCookie,
  signSessionEmail,
} from '../../../lib/auth/session';
import { normalizeEmail } from '../../../lib/auth/normalize';
import { ensureUserVavityAggregateExists } from '../../../lib/vavity/ensureUserVavityAggregate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};
  if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
    return res.status(400).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }

  try {
    const pending = await getPendingVerification(token);
    if (!pending) {
      return res.status(400).json({ error: 'This verification link is invalid or already used.', code: 'BAD_TOKEN' });
    }
    if (pending.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'This verification link has expired.', code: 'EXPIRED' });
    }

    const email = normalizeEmail(pending.email);
    const auth = await getUserAuthByEmail(email);
    if (!auth) {
      return res.status(400).json({ error: 'Account not found.', code: 'NO_ACCOUNT' });
    }
    if (auth.verificationToken !== token) {
      return res.status(400).json({ error: 'This verification link is invalid.', code: 'MISMATCH' });
    }
    if (auth.verified) {
      await deletePendingVerification(token);
      return res.status(200).json({ ok: true, email, alreadyVerified: true });
    }

    await putUserAuth(email, {
      email,
      passwordHash: auth.passwordHash,
      verified: true,
      updatedAt: Date.now(),
    });
    await deletePendingVerification(token);
    await ensureUserVavityAggregateExists(email);

    if (authSecretConfigured()) {
      const sessionToken = await signSessionEmail(email);
      if (sessionToken) {
        res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, 14 * 24 * 60 * 60));
      }
    }

    return res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error('[auth] verify error:', e);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
