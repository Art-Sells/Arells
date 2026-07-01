import type { NextApiRequest, NextApiResponse } from 'next';
import { buildEarningsPreviewPayload } from '../../../lib/portfolio/referralShares';
import { isS3WriteDisabled } from '../../../lib/server/s3WriteGuard';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

/** Dev-only: read-only earnings preview using engagement scores (no prod UI dependency). */
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
    const payload = await buildEarningsPreviewPayload(s3, bucket(), Date.now());
    return res.status(200).json({
      ...payload,
      s3WriteDisabled: isS3WriteDisabled(),
    });
  } catch (e) {
    console.error('[portfolio/earnings-preview]', e);
    return res.status(500).json({ error: 'Preview build failed' });
  }
}
