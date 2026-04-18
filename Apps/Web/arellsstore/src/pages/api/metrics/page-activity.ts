import type { NextApiRequest, NextApiResponse } from 'next';
import {
  aggregateMetricsPageMounts,
  metricsActivityTargetPath,
  type MetricsPageActivityPayload,
} from '../../../lib/metrics/metricsPageMounts';
import { computeMetricsRegisteredCombined } from '../../../lib/metrics/registeredCombinedCount';
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

function cacheKey(pagePath: string): string {
  const safe = encodeURIComponent(pagePath.replace(/\//g, '_'));
  return `analytics/metrics-page-activity-v4/${safe}.json`;
}

function cacheTtlMs(): number {
  const raw = process.env.METRICS_PAGE_ACTIVITY_CACHE_TTL_MS;
  if (raw === undefined || raw === '') return 120_000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 120_000;
}

function cacheDisabled(): boolean {
  return process.env.METRICS_PAGE_ACTIVITY_CACHE_DISABLED === '1';
}

async function tryReadCache(key: string, ttlMs: number): Promise<MetricsPageActivityPayload | null> {
  if (cacheDisabled()) return null;
  try {
    const obj = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    if (!obj.Body) return null;
    const parsed = JSON.parse(obj.Body.toString()) as MetricsPageActivityPayload;
    if (typeof parsed.generatedAt !== 'number' || typeof parsed.dau !== 'number') return null;
    if (Date.now() - parsed.generatedAt > ttlMs) return null;
    return parsed;
  } catch (e: unknown) {
    const err = e as { code?: string; statusCode?: number };
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    console.error('[metrics/page-activity] cache get', e);
    return null;
  }
}

async function writeCache(key: string, payload: MetricsPageActivityPayload): Promise<void> {
  if (cacheDisabled()) return;
  try {
    await s3
      .putObject({
        Bucket: bucket(),
        Key: key,
        Body: JSON.stringify(payload),
        ContentType: 'application/json',
      })
      .promise();
  } catch (e) {
    console.error('[metrics/page-activity] cache put', e);
  }
}

const inflight = new Map<string, Promise<MetricsPageActivityPayload>>();

async function buildPayload(pagePath: string): Promise<MetricsPageActivityPayload> {
  const now = Date.now();
  const [counts, registeredCombined] = await Promise.all([
    aggregateMetricsPageMounts(s3, bucket(), now),
    computeMetricsRegisteredCombined(s3, bucket()),
  ]);
  const cap = Math.max(0, registeredCombined);
  return {
    generatedAt: now,
    pagePath,
    dau: Math.min(counts.dau, cap),
    wau: Math.min(counts.wau, cap),
    mau: Math.min(counts.mau, cap),
    utcToday: counts.utcToday,
    wauRollingDays: counts.wauRollingDays,
    mauMonthStart: counts.mauMonthStart,
  };
}

async function recomputePageActivity(
  pagePath: string,
  cacheKey: string
): Promise<MetricsPageActivityPayload> {
  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  const p = (async () => {
    const payload = await buildPayload(pagePath);
    await writeCache(cacheKey, payload);
    return payload;
  })();

  inflight.set(cacheKey, p);
  try {
    return await p;
  } finally {
    inflight.delete(cacheKey);
  }
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

  const pagePath = metricsActivityTargetPath();
  const key = cacheKey(pagePath);
  const ttlMs = cacheTtlMs();
  const skipCache =
    req.query.nocache === '1' || req.query.nocache === 'true' || req.query.refresh === '1';

  try {
    if (!skipCache) {
      const cached = await tryReadCache(key, ttlMs);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const payload = await recomputePageActivity(pagePath, key);
    return res.status(200).json(payload);
  } catch (e) {
    console.error('[metrics/page-activity]', e);
    return res.status(500).json({ error: 'Failed to compute page activity' });
  }
}
