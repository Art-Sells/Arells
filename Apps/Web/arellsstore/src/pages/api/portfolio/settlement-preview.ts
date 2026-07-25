import type { NextApiRequest, NextApiResponse } from 'next';
import { buildSettlementPreviewPayload } from '../../../lib/portfolio/settlementPreview';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

function authorized(req: NextApiRequest): boolean {
  const secret = process.env.PORTFOLIO_SNAPSHOT_SECRET || process.env.METRICS_API_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  const auth = req.headers.authorization;
  const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  return bearer === secret || key === secret;
}

/**
 * Dry-run weekly settlement ledger (no Stripe).
 * GET|POST /api/portfolio/settlement-preview
 * Auth: Bearer PORTFOLIO_SNAPSHOT_SECRET or METRICS_API_SECRET (or ?key=).
 * In development with no secret set, open.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  try {
    const payload = await buildSettlementPreviewPayload(s3, bucket());
    return res.status(200).json(payload);
  } catch (e) {
    console.error('[portfolio/settlement-preview]', e);
    return res.status(500).json({ error: 'Failed to build settlement preview' });
  }
}
