import type { NextApiRequest, NextApiResponse } from 'next';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { hashEmailForAnalytics } from '../../../lib/analytics/userHash';
import { allowAnalyticsIp } from '../../../lib/analytics/ipRateLimit';
import { isLikelyAutomatedClient, userAgentFromHeaders } from '../../../lib/analytics/isLikelyAutomatedClient';
import { METRICS_PAGE_MOUNTS_PREFIX } from '../../../lib/metrics/metricsPageMounts';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers['x-forwarded-for'];
  const first =
    typeof xff === 'string' ? xff.split(',')[0].trim() : Array.isArray(xff) ? xff[0]?.trim() : '';
  return first || req.socket.remoteAddress || 'unknown';
}

function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Records that a signed-in user opened the Growth Metrics page today (UTC).
 * Dedupes only by hashed email — anonymous visits are not counted (DAUt/WAUt/MAUt = distinct accounts).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  const ip = getClientIp(req);
  if (!allowAnalyticsIp(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (isLikelyAutomatedClient(userAgentFromHeaders(req.headers))) {
    return res.status(204).end();
  }

  const auth = await getSessionFromRequest(req);
  const email = typeof auth?.email === 'string' ? auth.email.trim() : '';
  if (!email) {
    return res.status(204).end();
  }

  const dedupe = `h:${hashEmailForAnalytics(email)}`;
  const dayKey = utcDayKey(Date.now());
  const key = `${METRICS_PAGE_MOUNTS_PREFIX}${dayKey}/${encodeURIComponent(dedupe)}.json`;

  try {
    await s3
      .putObject({
        Bucket: bucket(),
        Key: key,
        Body: JSON.stringify({ at: Date.now() }),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();
  } catch (e) {
    console.error('[metrics/page-mount]', e);
    return res.status(500).json({ error: 'Storage write failed' });
  }

  return res.status(200).json({ ok: true });
}
