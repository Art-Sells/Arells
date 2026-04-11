import type { NextApiRequest, NextApiResponse } from 'next';
import { buildGrowthPayload } from '../../../lib/metrics/buildGrowthPayload';
import type { MetricsGrowthResponse } from '../../../lib/metrics/types';
import type { MetricsRange, MetricsSegment, MetricsView } from '../../../lib/metrics/types';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

function metricsGrowthAuthorized(req: NextApiRequest): boolean {
  const secret = process.env.METRICS_API_SECRET;
  if (!secret) return true;
  const auth = req.headers.authorization;
  const bearer = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  return bearer === secret || key === secret;
}

function parseRange(q: string | string[] | undefined): MetricsRange {
  const v = Array.isArray(q) ? q[0] : q;
  if (v === '1w' || v === '7d') return '1w';
  if (v === '1m' || v === '30d') return '1m';
  if (v === '3m' || v === '90d') return '3m';
  if (v === '1y' || v === '365d') return '1y';
  return 'all';
}

function parseSegment(q: string | string[] | undefined): MetricsSegment {
  const v = Array.isArray(q) ? q[0] : q;
  if (v === 'signed_in' || v === 'signed-in') return 'signed_in';
  if (v === 'sessions') return 'sessions';
  return 'all';
}

function parseView(q: string | string[] | undefined): MetricsView {
  const v = Array.isArray(q) ? q[0] : q;
  if (v === 'retention') return 'retention';
  return 'growth';
}

function growthCacheKey(range: MetricsRange, segment: MetricsSegment, view: MetricsView): string {
  return `analytics/metrics-growth-v2/${range}_${segment}_${view}.json`;
}

function growthCacheTtlMs(): number {
  const raw = process.env.METRICS_GROWTH_CACHE_TTL_MS;
  if (raw === undefined || raw === '') return 120_000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 120_000;
}

function growthCacheDisabled(): boolean {
  return process.env.METRICS_GROWTH_CACHE_DISABLED === '1';
}

async function tryReadGrowthCache(
  key: string,
  ttlMs: number
): Promise<MetricsGrowthResponse | null> {
  if (growthCacheDisabled()) return null;
  try {
    const obj = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
    if (!obj.Body) return null;
    const parsed = JSON.parse(obj.Body.toString()) as MetricsGrowthResponse;
    if (
      typeof parsed.generatedAt !== 'number' ||
      !Array.isArray(parsed.series) ||
      !parsed.headlines ||
      typeof parsed.headlines.registeredCombined !== 'number' ||
      typeof parsed.metricsEpochStartMs !== 'number' ||
      !parsed.rangePresetsAvailable ||
      typeof parsed.rangePresetsAvailable['1w'] !== 'boolean'
    ) {
      return null;
    }
    if (Date.now() - parsed.generatedAt > ttlMs) return null;
    return parsed;
  } catch (e: unknown) {
    const err = e as { code?: string; statusCode?: number };
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    console.error('[metrics/growth] cache get', e);
    return null;
  }
}

async function writeGrowthCache(key: string, payload: MetricsGrowthResponse): Promise<void> {
  if (growthCacheDisabled()) return;
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
    console.error('[metrics/growth] cache put', e);
  }
}

const recomputeInflight = new Map<string, Promise<MetricsGrowthResponse>>();

async function recomputeGrowth(
  range: MetricsRange,
  segment: MetricsSegment,
  view: MetricsView,
  cacheKey: string
): Promise<MetricsGrowthResponse> {
  const existing = recomputeInflight.get(cacheKey);
  if (existing) return existing;

  const p = (async () => {
    const payload = await buildGrowthPayload(s3, bucket(), range, segment, view);
    await writeGrowthCache(cacheKey, payload);
    return payload;
  })();

  recomputeInflight.set(cacheKey, p);
  try {
    return await p;
  } finally {
    recomputeInflight.delete(cacheKey);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!metricsGrowthAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  const range = parseRange(req.query.range);
  const segment = parseSegment(req.query.segment);
  const view = parseView(req.query.view);
  const cacheKey = growthCacheKey(range, segment, view);
  const ttlMs = growthCacheTtlMs();
  const skipCache =
    req.query.nocache === '1' || req.query.nocache === 'true' || req.query.refresh === '1';

  try {
    if (!skipCache) {
      const cached = await tryReadGrowthCache(cacheKey, ttlMs);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const payload = await recomputeGrowth(range, segment, view, cacheKey);
    return res.status(200).json(payload);
  } catch (e) {
    console.error('[metrics/growth]', e);
    return res.status(500).json({ error: 'Failed to build growth metrics' });
  }
}
