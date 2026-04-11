import type { NextApiRequest, NextApiResponse } from 'next';
import { loadAllSessionMetasFromS3 } from '../../../lib/analytics/loadSessionMetasFromS3';
import type { AnalyticsMetricsSummaryJson, AnalyticsSessionMeta } from '../../../lib/analytics/types';
import { ANALYTICS_METRICS_AGGREGATE_KEY, HUMAN_DURATION_MS } from '../../../lib/analytics/types';
import { getServerS3 } from '../../../lib/server/awsS3';

const s3 = getServerS3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

function aggregateTtlMs(): number {
  const raw = process.env.ANALYTICS_SUMMARY_AGGREGATE_TTL_MS;
  if (raw === undefined || raw === '') return 8000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 8000;
}

function aggregateDisabled(): boolean {
  return process.env.ANALYTICS_SUMMARY_AGGREGATE_DISABLED === '1';
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function buildSummaryFromMetas(metas: AnalyticsSessionMeta[]): AnalyticsMetricsSummaryJson {
  const uniqueIps = new Set<string>();
  let humanLikely = 0;
  let botLikely = 0;
  let totalDuration = 0;
  const byFirstSeenDay: Record<string, number> = {};
  let signedInSessions = 0;

  for (const m of metas) {
    uniqueIps.add(m.lastIp || 'unknown');
    const d = m.lastSeenAt - m.firstSeenAt;
    totalDuration += Math.max(0, d);
    if (d >= HUMAN_DURATION_MS) humanLikely += 1;
    else botLikely += 1;

    const dk = dayKey(m.firstSeenAt);
    byFirstSeenDay[dk] = (byFirstSeenDay[dk] || 0) + 1;

    if (m.userHash) signedInSessions += 1;
  }

  const n = metas.length || 1;
  metas.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  const recentSessions = metas.slice(0, 150).map((m) => {
    const durationMs = Math.max(0, m.lastSeenAt - m.firstSeenAt);
    return {
      sessionId: m.sessionId,
      firstSeenAt: m.firstSeenAt,
      lastSeenAt: m.lastSeenAt,
      durationMs,
      humanLikely: durationMs >= HUMAN_DURATION_MS,
      lastIp: m.lastIp,
      userAgent: m.userAgent.slice(0, 120),
      signedIn: Boolean(m.userHash),
      heartbeats: m.heartbeatCount,
      pageviews: m.pageviewCount,
      lastPath: m.lastPath,
    };
  });

  return {
    generatedAt: Date.now(),
    humanThresholdMs: HUMAN_DURATION_MS,
    totalSessions: metas.length,
    uniqueIps: uniqueIps.size,
    signedInSessions,
    humanLikelyCount: humanLikely,
    botLikelyCount: botLikely,
    avgDurationMs: Math.round(totalDuration / n),
    byFirstSeenDay,
    recentSessions,
  };
}

async function loadAllSessionMetas(): Promise<AnalyticsSessionMeta[]> {
  return loadAllSessionMetasFromS3(s3, bucket());
}

async function tryReadFreshAggregate(ttlMs: number): Promise<AnalyticsMetricsSummaryJson | null> {
  if (aggregateDisabled()) return null;
  try {
    const obj = await s3.getObject({ Bucket: bucket(), Key: ANALYTICS_METRICS_AGGREGATE_KEY }).promise();
    if (!obj.Body) return null;
    const parsed = JSON.parse(obj.Body.toString()) as AnalyticsMetricsSummaryJson;
    if (
      typeof parsed.generatedAt !== 'number' ||
      typeof parsed.totalSessions !== 'number' ||
      !Array.isArray(parsed.recentSessions)
    ) {
      return null;
    }
    if (Date.now() - parsed.generatedAt > ttlMs) return null;
    return parsed;
  } catch (e: unknown) {
    const err = e as { code?: string; statusCode?: number };
    if (err.code === 'NoSuchKey' || err.statusCode === 404) return null;
    console.error('[analytics] aggregate getObject', e);
    return null;
  }
}

async function writeAggregate(payload: AnalyticsMetricsSummaryJson): Promise<void> {
  if (aggregateDisabled()) return;
  try {
    await s3
      .putObject({
        Bucket: bucket(),
        Key: ANALYTICS_METRICS_AGGREGATE_KEY,
        Body: JSON.stringify(payload),
        ContentType: 'application/json',
      })
      .promise();
  } catch (e) {
    console.error('[analytics] aggregate putObject', e);
  }
}

/** Single-flight recompute per server instance to avoid duplicate full scans. */
let recomputeInFlight: Promise<AnalyticsMetricsSummaryJson> | null = null;

async function recomputeSummary(): Promise<AnalyticsMetricsSummaryJson> {
  if (recomputeInFlight) return recomputeInFlight;

  recomputeInFlight = (async () => {
    const metas = await loadAllSessionMetas();
    const payload = buildSummaryFromMetas(metas);
    await writeAggregate(payload);
    return payload;
  })();

  try {
    return await recomputeInFlight;
  } finally {
    recomputeInFlight = null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  const ttlMs = aggregateTtlMs();
  const skipCache =
    req.query.nocache === '1' || req.query.nocache === 'true' || req.query.refresh === '1';

  try {
    if (!skipCache) {
      const cached = await tryReadFreshAggregate(ttlMs);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const payload = await recomputeSummary();
    return res.status(200).json(payload);
  } catch (e) {
    console.error('[analytics] summary', e);
    return res.status(500).json({ error: 'Failed to build analytics summary' });
  }
}
