import type { NextApiRequest, NextApiResponse } from 'next';
import { clearSessionCookieHeader } from '../../../lib/auth/session';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', clearSessionCookieHeader());
  return res.status(200).json({ ok: true });
}
