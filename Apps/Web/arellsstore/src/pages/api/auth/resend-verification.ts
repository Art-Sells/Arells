import type { NextApiRequest, NextApiResponse } from 'next';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import {
  deletePendingVerification,
  getUserAuthByEmail,
  putPendingVerification,
  putUserAuth,
} from '../../../lib/auth/s3UserAuth';
import { generateOtpCode, OTP_TTL_MS } from '../../../lib/auth/otpCode';
import { sendVerificationEmail } from '../../../lib/auth/sendVerificationEmail';

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
    if (!auth) {
      return res.status(400).json({ error: 'Account not found.', code: 'NO_ACCOUNT' });
    }
    if (auth.verified) {
      return res.status(400).json({ error: 'Email is already verified.', code: 'ALREADY_VERIFIED' });
    }

    if (auth.verificationToken) {
      await deletePendingVerification(auth.verificationToken);
    }

    const code = generateOtpCode();
    const verificationExpiresAt = Date.now() + OTP_TTL_MS;
    await putUserAuth(email, {
      ...auth,
      verificationToken: code,
      verificationExpiresAt,
      updatedAt: Date.now(),
    });
    await putPendingVerification(code, { email, expiresAt: verificationExpiresAt });

    const sendResult = await sendVerificationEmail({ to: email, code });

    return res.status(200).json({
      ok: true,
      emailDispatched: sendResult.sent,
      codeExpiresInMs: OTP_TTL_MS,
    });
  } catch (e) {
    console.error('[auth] resend-verification error:', e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
