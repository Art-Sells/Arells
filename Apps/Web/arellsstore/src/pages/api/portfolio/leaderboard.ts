import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { buildLeaderboardRows } from '../../../lib/portfolio/referralShares';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  try {
    const rows = await buildLeaderboardRows(s3, bucket());
    return res.status(200).json({ rows });
  } catch (e) {
    console.error('[portfolio/leaderboard]', e);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
}
