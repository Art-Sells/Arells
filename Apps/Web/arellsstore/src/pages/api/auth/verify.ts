import type { NextApiRequest, NextApiResponse } from 'next';
import { mergeAuthPreservingReferral } from '../../../lib/auth/referral';
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
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import { normalizeOtpCode } from '../../../lib/auth/otpCode';
import { ensureUserVavityAggregateExists } from '../../../lib/vavity/ensureUserVavityAggregate';

async function completeVerification(email: string, auth: NonNullable<Awaited<ReturnType<typeof getUserAuthByEmail>>>, res: NextApiResponse) {
  if (auth.verified) {
    if (authSecretConfigured()) {
      const sessionToken = await signSessionEmail(email);
      if (sessionToken) {
        res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, 14 * 24 * 60 * 60));
      }
    }
    return res.status(200).json({ ok: true, email, alreadyVerified: true });
  }

  await putUserAuth(
    email,
    mergeAuthPreservingReferral(auth, {
      email,
      passwordHash: auth.passwordHash,
      verified: true,
      verificationToken: undefined,
      verificationExpiresAt: undefined,
      updatedAt: Date.now(),
    })
  );
  await ensureUserVavityAggregateExists(email);

  if (authSecretConfigured()) {
    const sessionToken = await signSessionEmail(email);
    if (sessionToken) {
      res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, 14 * 24 * 60 * 60));
    }
  }

  return res.status(200).json({ ok: true, email });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, email: rawEmail, code: rawCode } = req.body || {};

  try {
    // New OTP path: email + 6-digit code
    const code = normalizeOtpCode(rawCode);
    if (typeof rawEmail === 'string' && code) {
      const email = normalizeEmail(rawEmail);
      if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' });
      }

      const auth = await getUserAuthByEmail(email);
      if (!auth) {
        return res.status(400).json({ error: 'Invalid or expired code.', code: 'BAD_CODE' });
      }
      if (!auth.verificationToken || auth.verificationToken !== code) {
        return res.status(400).json({ error: 'Invalid or expired code.', code: 'BAD_CODE' });
      }
      if (!auth.verificationExpiresAt || auth.verificationExpiresAt < Date.now()) {
        return res.status(400).json({ error: 'This code has expired.', code: 'EXPIRED' });
      }

      await deletePendingVerification(code);
      return completeVerification(email, auth, res);
    }

    // Legacy link-token path (old emails)
    if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
      return res.status(400).json({ error: 'Invalid code.', code: 'INVALID_CODE' });
    }

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

    await deletePendingVerification(token);
    return completeVerification(email, auth, res);
  } catch (e) {
    console.error('[auth] verify error:', e);
    return res.status(500).json({ error: 'Verification failed' });
  }
}
