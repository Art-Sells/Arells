import type { NextApiRequest, NextApiResponse } from 'next';
import { getMetricsPageActivity } from '../../../lib/metrics/pageActivityCache';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

function metricsAuthorized(req: NextApiRequest): boolean {
  const secret = process.env.METRICS_API_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization;
  const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  return bearer === secret || key === secret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!metricsAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  const skipCache =
    req.query.nocache === '1' || req.query.nocache === 'true' || req.query.refresh === '1';

  try {
    const payload = await getMetricsPageActivity(s3, bucket(), { skipCache });
    return res.status(200).json(payload);
  } catch (e) {
    console.error('[metrics/page-activity]', e);
    return res.status(500).json({ error: 'Failed to compute page activity' });
  }
}
