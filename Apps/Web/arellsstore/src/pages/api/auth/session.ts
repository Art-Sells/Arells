import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getSessionFromRequest(req);
  if (!session) {
    return res.status(200).json({ email: null });
  }
  return res.status(200).json({ email: session.email });
}
