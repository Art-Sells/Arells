import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { cropStoredCharacterMetaposter } from '../../../lib/server/characterMetaposterCrop';

/** Signed-in: crop the stored character metaposter. Loop file is left as-is. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = await getSessionFromRequest(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await cropStoredCharacterMetaposter(session.email, 'bitcoin');
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crop failed';
    console.error('crop-stored-metaposter', err);
    return res.status(500).json({ error: message });
  }
}
