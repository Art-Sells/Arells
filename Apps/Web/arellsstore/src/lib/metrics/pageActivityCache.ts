import type AWS from 'aws-sdk';
import {
  aggregateSignedInUserTraffic,
  metricsActivityTargetPath,
  type MetricsPageActivityPayload,
} from './metricsPageMounts';

function cacheKey(pagePath: string): string {
  const safe = encodeURIComponent(pagePath.replace(/\//g, '_'));
  return `analytics/metrics-page-activity-v18/${safe}.json`;
}

function cacheTtlMs(): number {
  const raw = process.env.METRICS_PAGE_ACTIVITY_CACHE_TTL_MS;
  if (raw === undefined || raw === '') return 120_000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 120_000;
}

function cacheDisabled(): boolean {
  return (
    process.env.METRICS_PAGE_ACTIVITY_CACHE_DISABLED === '1' ||
    process.env.NODE_ENV === 'development'
  );
}

async function tryReadCache(
  s3: AWS.S3,
  bucket: string,
  key: string,
  ttlMs: number
): Promise<MetricsPageActivityPayload | null> {
  if (cacheDisabled()) return null;
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
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

async function writeCache(
  s3: AWS.S3,
  bucket: string,
  key: string,
  payload: MetricsPageActivityPayload
): Promise<void> {
  if (cacheDisabled()) return;
  if (process.env.S3_WRITE_DISABLED === '1') return;
  try {
    await s3
      .putObject({
        Bucket: bucket,
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

async function buildPayload(
  s3: AWS.S3,
  bucket: string,
  pagePath: string
): Promise<MetricsPageActivityPayload> {
  const now = Date.now();
  const counts = await aggregateSignedInUserTraffic(s3, bucket, now);
  return {
    generatedAt: now,
    pagePath,
    dau: counts.dau,
    wau: counts.wau,
    mau: counts.mau,
    utcToday: counts.utcToday,
    wauRollingDays: counts.wauRollingDays,
    mauMonthStart: counts.mauMonthStart,
  };
}

async function recomputePageActivity(
  s3: AWS.S3,
  bucket: string,
  pagePath: string,
  key: string
): Promise<MetricsPageActivityPayload> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    const payload = await buildPayload(s3, bucket, pagePath);
    await writeCache(s3, bucket, key, payload);
    return payload;
  })();

  inflight.set(key, p);
  try {
    return await p;
  } finally {
    inflight.delete(key);
  }
}

/**
 * Same DAU/WAU/MAU payload as GET /api/metrics/page-activity (shared S3 cache + compute).
 * Portfolio uses this so My Portfolio WAU matches the metrics activity panel.
 */
export async function getMetricsPageActivity(
  s3: AWS.S3,
  bucket: string,
  opts?: { skipCache?: boolean }
): Promise<MetricsPageActivityPayload> {
  const pagePath = metricsActivityTargetPath();
  const key = cacheKey(pagePath);
  const ttlMs = cacheTtlMs();

  if (!opts?.skipCache) {
    const cached = await tryReadCache(s3, bucket, key, ttlMs);
    if (cached) return cached;
  }

  return recomputePageActivity(s3, bucket, pagePath, key);
}
