import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { normalizeEmail } from '../../../lib/auth/normalize';
import {
  deletePendingReset,
  getPendingReset,
  getUserAuthByEmail,
  putUserAuth,
} from '../../../lib/auth/s3UserAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { token } = req.query;
    if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
      return res.status(400).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    try {
      const pending = await getPendingReset(token);
      if (!pending) {
        return res.status(400).json({ error: 'This reset link is invalid or already used.', code: 'BAD_TOKEN' });
      }
      if (pending.expiresAt < Date.now()) {
        return res.status(400).json({ error: 'This reset link has expired.', code: 'EXPIRED' });
      }
      return res.status(200).json({ ok: true, email: normalizeEmail(pending.email) });
    } catch (e) {
      console.error('[auth] reset-password GET error:', e);
      return res.status(500).json({ error: 'Something went wrong.' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, password, passwordConfirm } = req.body || {};
  if (typeof token !== 'string' || token.length < 16 || token.length > 128) {
    return res.status(400).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (typeof password !== 'string' || typeof passwordConfirm !== 'string') {
    return res.status(400).json({ error: 'Invalid request', code: 'INVALID_BODY' });
  }
  if (password !== passwordConfirm) {
    return res.status(400).json({ error: 'Passwords do not match.', code: 'PASSWORD_MISMATCH' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.', code: 'PASSWORD_SHORT' });
  }

  try {
    const pending = await getPendingReset(token);
    if (!pending) {
      return res.status(400).json({ error: 'This reset link is invalid or already used.', code: 'BAD_TOKEN' });
    }
    if (pending.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'This reset link has expired.', code: 'EXPIRED' });
    }

    const email = normalizeEmail(pending.email);
    const auth = await getUserAuthByEmail(email);
    if (!auth) {
      return res.status(400).json({ error: 'Account not found.', code: 'NO_ACCOUNT' });
    }
    if (auth.resetToken !== token) {
      return res.status(400).json({ error: 'This reset link is invalid.', code: 'BAD_TOKEN' });
    }

    const samePassword = await bcrypt.compare(password, auth.passwordHash);
    if (samePassword) {
      return res.status(400).json({
        error: 'New password cannot be the same as your current password.',
        code: 'SAME_PASSWORD',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await putUserAuth(email, {
      email,
      passwordHash,
      verified: auth.verified,
      updatedAt: Date.now(),
    });
    await deletePendingReset(token);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[auth] reset-password POST error:', e);
    return res.status(500).json({ error: 'Password reset failed.' });
  }
}
