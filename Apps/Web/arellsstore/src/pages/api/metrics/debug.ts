import type { NextApiRequest, NextApiResponse } from 'next';
import { buildMetricsActivityDebug } from '../../../lib/metrics/metricsPageMounts';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

/** Local troubleshooting: GET /api/metrics/debug — per-account S3 dates + DAU/WAU/MAU breakdown. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  try {
    const payload = await buildMetricsActivityDebug(s3, bucket(), Date.now());
    return res.status(200).json(payload);
  } catch (e) {
    console.error('[metrics/debug]', e);
    return res.status(500).json({ error: 'Debug build failed' });
  }
}
