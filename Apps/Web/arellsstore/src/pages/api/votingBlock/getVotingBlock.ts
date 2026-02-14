import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchVotingBlock } from '../../../utils/votingBlock';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await fetchVotingBlock();
    const now = Date.now();
    const remainingMs = Math.max(data.expiresAt - now, 0);
    return res.status(200).json({
      ...data,
      remainingMs,
      isExpired: now >= data.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load voting block' });
  }
}
