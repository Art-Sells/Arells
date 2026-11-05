import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveReferrerEmailFromCode } from '../../../lib/auth/referral';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { cropStoredCharacterMetaposter } from '../../../lib/server/characterMetaposterCrop';

/** Crop the stored character metaposter. The square still and loop are kept as-is. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let email = (await getSessionFromRequest(req))?.email || null;
  const rawShare = Array.isArray(req.query.shareId) ? req.query.shareId[0] : req.query.shareId;
  if (!email && process.env.NODE_ENV === 'development' && typeof rawShare === 'string') {
    email = await resolveReferrerEmailFromCode(rawShare);
  }
  if (!email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await cropStoredCharacterMetaposter(email, 'bitcoin');
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crop failed';
    console.error('crop-stored-metaposter', err);
    return res.status(500).json({ error: message });
  }
}
