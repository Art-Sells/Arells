import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { EMAIL_RE, normalizeEmail } from '../../../lib/auth/normalize';
import { getUserAuthByEmail } from '../../../lib/auth/s3UserAuth';
import {
  authSecretConfigured,
  buildSessionCookie,
  signSessionEmail,
} from '../../../lib/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authSecretConfigured()) {
    return res.status(503).json({ error: 'Server auth is not configured.', code: 'AUTH_CONFIG' });
  }

  const { email: rawEmail, password } = req.body || {};
  if (typeof rawEmail !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid request', code: 'INVALID_BODY' });
  }

  const email = normalizeEmail(rawEmail);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.', code: 'INVALID_EMAIL' });
  }

  try {
    const auth = await getUserAuthByEmail(email);
    if (!auth) {
      return res.status(401).json({
        error: 'No account exists for this email.',
        code: 'NO_ACCOUNT',
      });
    }
    if (!auth.verified) {
      return res.status(403).json({
        error: 'Verify your email before signing in.',
        code: 'NOT_VERIFIED',
      });
    }

    const ok = await bcrypt.compare(password, auth.passwordHash);
    if (!ok) {
      return res.status(401).json({
        error: 'Password does not match.',
        code: 'WRONG_PASSWORD',
      });
    }

    const token = await signSessionEmail(email);
    if (!token) {
      return res.status(503).json({ error: 'Could not create session.', code: 'AUTH_CONFIG' });
    }

    res.setHeader('Set-Cookie', buildSessionCookie(token, 14 * 24 * 60 * 60));
    return res.status(200).json({ ok: true, email });
  } catch (e) {
    console.error('[auth] login error:', e);
    return res.status(500).json({ error: 'Sign in failed' });
  }
}
