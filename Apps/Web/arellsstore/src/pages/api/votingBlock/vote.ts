import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchVotingBlock, saveVotingBlock } from '../../../utils/votingBlock';

type VoteAsset = 'solana' | 'xrp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { asset, sessionId } = req.body || {};
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  if (asset !== 'solana' && asset !== 'xrp') {
    return res.status(400).json({ error: 'Invalid asset' });
  }

  try {
    const data = await fetchVotingBlock();
    const now = Date.now();
    if (now >= data.expiresAt) {
      return res.status(200).json({ ...data, remainingMs: 0, isExpired: true });
    }

    if (data.sessions.includes(sessionId)) {
      const remainingMs = Math.max(data.expiresAt - now, 0);
      return res.status(200).json({ ...data, remainingMs, isExpired: false });
    }

    const next = {
      ...data,
      votes: {
        ...data.votes,
        [asset]: data.votes[asset as VoteAsset] + 1,
      },
      sessions: [...data.sessions, sessionId],
      updatedAt: now,
    };

    await saveVotingBlock(next);
    const remainingMs = Math.max(next.expiresAt - now, 0);
    return res.status(200).json({ ...next, remainingMs, isExpired: false });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save vote' });
  }
}
