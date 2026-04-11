import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import type { AnalyticsBeaconType, AnalyticsSessionMeta } from '../../../lib/analytics/types';
import { sessionMetaKey } from '../../../lib/analytics/types';
import { mergeSessionMeta } from '../../../lib/analytics/mergeMeta';
import { allowAnalyticsIp } from '../../../lib/analytics/ipRateLimit';
import { hashEmailForAnalytics } from '../../../lib/analytics/userHash';
import { getSessionFromRequest } from '../../../lib/auth/session';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== '1') {
    return res.status(204).end();
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'Analytics storage not configured' });
  }

  const ip = getClientIp(req);
  if (!allowAnalyticsIp(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const body = req.body || {};
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const typeRaw = typeof body.type === 'string' ? body.type.toLowerCase() : '';
  const path = typeof body.path === 'string' ? body.path.slice(0, 256) : undefined;

  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId' });
  }

  const type = (['open', 'heartbeat', 'pageview'].includes(typeRaw) ? typeRaw : '') as AnalyticsBeaconType | '';
  if (!type) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';
  const now = Date.now();

  const auth = await getSessionFromRequest(req);
  const userHash = auth?.email ? hashEmailForAnalytics(auth.email) : null;

  const key = sessionMetaKey(sessionId);
  let prev: AnalyticsSessionMeta | null = null;
  try {
    const obj = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    if (obj.Body) {
      prev = JSON.parse(obj.Body.toString()) as AnalyticsSessionMeta;
    }
  } catch (e: any) {
    if (e.code !== 'NoSuchKey' && e.statusCode !== 404) {
      console.error('[analytics] getObject', e);
      return res.status(500).json({ error: 'Storage read failed' });
    }
  }

  const next = mergeSessionMeta(prev, sessionId, now, ip, ua, type, path, userHash);

  try {
    await s3
      .putObject({
        Bucket: bucket(),
        Key: key,
        Body: JSON.stringify(next),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();
  } catch (e) {
    console.error('[analytics] putObject', e);
    return res.status(500).json({ error: 'Storage write failed' });
  }

  return res.status(200).json({ ok: true });
}
