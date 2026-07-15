import type { NextApiRequest, NextApiResponse } from 'next';
import { recomputePortfolioContextSnapshot } from '../../../lib/portfolio/portfolioContextSnapshot';
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
 * Cron / admin: rebuild analytics/portfolio-context-v1/latest.json.
 * POST /api/portfolio/recompute-snapshot
 * Auth: Bearer PORTFOLIO_SNAPSHOT_SECRET or METRICS_API_SECRET (or ?key=).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  try {
    const snapshot = await recomputePortfolioContextSnapshot(s3, bucket());
    return res.status(200).json({
      ok: true,
      generatedAt: snapshot.generatedAt,
      wau: snapshot.wau,
      rowCount: snapshot.leaderboardRows.length,
      totalEngagementScore: snapshot.totalEngagementScore,
    });
  } catch (e) {
    console.error('[portfolio/recompute-snapshot]', e);
    return res.status(500).json({ error: 'Failed to recompute portfolio snapshot' });
  }
}
