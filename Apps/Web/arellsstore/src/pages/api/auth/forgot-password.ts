import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import { getUserAuthByEmail, putPendingReset, putUserAuth } from '../../../lib/auth/s3UserAuth';
import { resolveAppOrigin, resolveEmailLogoUrl } from '../../../lib/auth/origin';
import { sendPasswordResetEmail } from '../../../lib/auth/sendPasswordResetEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: rawEmail, origin: bodyOrigin } = req.body || {};
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
      return res.status(200).json({ ok: true });
    }

    const token = randomBytes(32).toString('hex');
    const resetExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

    await putUserAuth(email, { ...auth, resetToken: token, resetExpiresAt, updatedAt: Date.now() });
    await putPendingReset(token, { email, expiresAt: resetExpiresAt });

    const appOrigin = resolveAppOrigin(req.headers.origin, bodyOrigin);
    const resetUrl = `${appOrigin}/reset-password/${token}`;
    const logoUrl = resolveEmailLogoUrl(appOrigin);

    await sendPasswordResetEmail({ to: email, resetUrl, logoUrl });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[auth] forgot-password error:', e);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
