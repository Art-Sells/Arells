import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { getSessionFromRequest } from '../../../lib/auth/session';
import { hashEmailForAnalytics } from '../../../lib/analytics/userHash';
import { allowAnalyticsIp } from '../../../lib/analytics/ipRateLimit';
import { METRICS_PAGE_MOUNTS_PREFIX } from '../../../lib/metrics/metricsPageMounts';

const s3 = new AWS.S3({
  region: process.env.WS_REGION,
  accessKeyId: process.env.WS_ACCESS_KEY_ID,
  secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
});

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESS_RE = /^sess-[a-z0-9]+-[a-z0-9]+$/i;

function isValidSessionId(id: string): boolean {
  const t = id.trim();
  return t.length >= 8 && t.length <= 128 && (UUID_RE.test(t) || SESS_RE.test(t));
}

function utcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Records that this browser (session) opened the Growth Metrics page today (UTC).
 * Signed-in users dedupe by hashed email; anonymous by sessionId. Does not require analytics beacons.
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

  const body = req.body || {};
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }

  const auth = await getSessionFromRequest(req);
  const userHash = auth?.email ? hashEmailForAnalytics(auth.email) : null;
  const dedupe = userHash ? `h:${userHash}` : `s:${sessionId}`;
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
