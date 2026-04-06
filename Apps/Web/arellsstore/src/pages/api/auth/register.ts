import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import { validateAuthPassword } from '../../../lib/auth/validateAuthPassword';
import { getUserAuthByEmail, putPendingVerification, putUserAuth } from '../../../lib/auth/s3UserAuth';
import { resolveAppOrigin, resolveEmailLogoUrl } from '../../../lib/auth/origin';
import { sendVerificationEmail } from '../../../lib/auth/sendVerificationEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email: rawEmail, password, passwordConfirm, origin: bodyOrigin } = req.body || {};
  if (typeof rawEmail !== 'string' || typeof password !== 'string' || typeof passwordConfirm !== 'string') {
    return res.status(400).json({ error: 'Invalid request', code: 'INVALID_BODY' });
  }

  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' });
  }
  if (password !== passwordConfirm) {
    return res.status(400).json({ error: 'Passwords do not match.', code: 'PASSWORD_MISMATCH' });
  }
  const pw = validateAuthPassword(password);
  if (!pw.ok) {
    return res.status(400).json({ error: pw.error, code: pw.code });
  }

  try {
    const existing = await getUserAuthByEmail(email);
    if (existing?.verified) {
      return res.status(409).json({ error: 'account email exists', code: 'EMAIL_EXISTS' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const token = randomBytes(32).toString('hex');
    const verificationExpiresAt = Date.now() + 48 * 60 * 60 * 1000;
    const now = Date.now();

    await putUserAuth(email, {
      email,
      passwordHash,
      verified: false,
      verificationToken: token,
      verificationExpiresAt,
      updatedAt: now,
    });

    await putPendingVerification(token, { email, expiresAt: verificationExpiresAt });

    const appOrigin = resolveAppOrigin(req.headers.origin, bodyOrigin);
    const verifyUrl = `${appOrigin}/verified/${token}`;
    const logoUrl = resolveEmailLogoUrl(appOrigin);

    const sendResult = await sendVerificationEmail({ to: email, verifyUrl, logoUrl });

    return res.status(200).json({
      ok: true,
      email,
      emailDispatched: sendResult.sent,
      emailDispatchNote: sendResult.skippedReason,
    });
  } catch (e) {
    console.error('[auth] register error:', e);
    return res.status(500).json({ error: 'Registration failed' });
  }
}
