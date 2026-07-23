import type { NextApiRequest, NextApiResponse } from 'next';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import {
  deletePendingReset,
  getUserAuthByEmail,
  putPendingReset,
  putUserAuth,
} from '../../../lib/auth/s3UserAuth';
import { generateOtpCode, OTP_TTL_MS } from '../../../lib/auth/otpCode';
import { sendPasswordResetEmail } from '../../../lib/auth/sendPasswordResetEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: rawEmail } = req.body || {};
  if (typeof rawEmail !== 'string') {
    return res.status(400).json({ error: 'Invalid request', code: 'INVALID_BODY' });
  }

  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' });
  }

  try {
    const auth = await getUserAuthByEmail(email);
    if (!auth || !auth.verified) {
      return res.status(200).json({ ok: true, codeExpiresInMs: OTP_TTL_MS });
    }

    if (auth.resetToken && auth.resetToken.length === 6) {
      await deletePendingReset(auth.resetToken);
    }

    const code = generateOtpCode();
    const resetExpiresAt = Date.now() + OTP_TTL_MS;
    await putUserAuth(email, { ...auth, resetToken: code, resetExpiresAt, updatedAt: Date.now() });
    await putPendingReset(code, { email, expiresAt: resetExpiresAt });

    await sendPasswordResetEmail({ to: email, code });

    return res.status(200).json({ ok: true, codeExpiresInMs: OTP_TTL_MS });
  } catch (e) {
    console.error('[auth] resend-password-reset error:', e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
