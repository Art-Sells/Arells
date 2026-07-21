import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { getAssetNewsSnapshot } from '../../../lib/news/assetNewsService';
import { getServerS3 } from '../../../lib/server/awsS3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bucket = process.env.S3_BUCKET_NAME || null;
    const s3 = bucket ? getServerS3() : null;
    const snapshot = await getAssetNewsSnapshot(s3, bucket);
    return res.status(200).json(snapshot);
  } catch (e) {
    console.error('[portfolio/news]', e);
    return res.status(500).json({ error: 'Failed to load news' });
  }
}
