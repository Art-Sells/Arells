import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { findPaidUnusedCredit } from '../../../lib/server/characterGenerationCredit';
import { normalizeAlienPhotoAsset } from '../../../lib/server/alienPhoto';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rawAsset = Array.isArray(req.query.asset) ? req.query.asset[0] : req.query.asset;
  const assetId = normalizeAlienPhotoAsset(rawAsset);
  if (!assetId) {
    return res.status(400).json({ error: 'Unsupported asset' });
  }

  try {
    const credit = await findPaidUnusedCredit(session.email, assetId);
    return res.status(200).json({
      paid: Boolean(credit),
      creditId: credit?.creditId || null,
    });
  } catch (err) {
    console.error('character-credit', err);
    return res.status(500).json({ error: 'Could not load payment credit' });
  }
};

export default handler;
