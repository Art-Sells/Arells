import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import {
  deletePendingReset,
  getUserAuthByEmail,
  putPendingReset,
  putUserAuth,
} from '../../../lib/auth/s3UserAuth';
import { normalizeOtpCode, RESET_SESSION_TTL_MS } from '../../../lib/auth/otpCode';

/**
 * Exchange a password-reset OTP for a longer-lived reset session token
 * used by POST /api/auth/reset-password.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: rawEmail, code: rawCode } = req.body || {};
  const code = normalizeOtpCode(rawCode);
  if (typeof rawEmail !== 'string' || !code) {
    return res.status(400).json({ error: 'Enter the 6-digit code.', code: 'INVALID_CODE' });
  }

  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' });
  }

  try {
    const auth = await getUserAuthByEmail(email);
    if (!auth || !auth.verified) {
      return res.status(400).json({ error: 'Invalid or expired code.', code: 'BAD_CODE' });
    }
    if (!auth.resetToken || auth.resetToken !== code) {
      return res.status(400).json({ error: 'Invalid or expired code.', code: 'BAD_CODE' });
    }
    if (!auth.resetExpiresAt || auth.resetExpiresAt < Date.now()) {
      return res.status(400).json({ error: 'This code has expired.', code: 'EXPIRED' });
    }

    await deletePendingReset(code);

    const resetToken = randomBytes(32).toString('hex');
    const resetExpiresAt = Date.now() + RESET_SESSION_TTL_MS;
    await putUserAuth(email, {
      ...auth,
      resetToken,
      resetExpiresAt,
      updatedAt: Date.now(),
    });
    await putPendingReset(resetToken, { email, expiresAt: resetExpiresAt });

    return res.status(200).json({ ok: true, email, resetToken });
  } catch (e) {
    console.error('[auth] confirm-reset-code error:', e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
