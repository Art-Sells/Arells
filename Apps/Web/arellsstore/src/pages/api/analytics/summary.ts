import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import type { AnalyticsSessionMeta } from '../../../lib/analytics/types';
import { ANALYTICS_META_PREFIX, HUMAN_DURATION_MS } from '../../../lib/analytics/types';

const s3 = new AWS.S3();

function bucket(): string {
  const b = process.env.S3_BUCKET_NAME;
  if (!b) throw new Error('S3_BUCKET_NAME is not set');
  return b;
}

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.S3_BUCKET_NAME) {
    return res.status(503).json({ error: 'S3 not configured' });
  }

  const metas: AnalyticsSessionMeta[] = [];
  let token: string | undefined;

  try {
    do {
      const out = await s3
        .listObjectsV2({
          Bucket: bucket(),
          Prefix: ANALYTICS_META_PREFIX,
          ContinuationToken: token,
          MaxKeys: 500,
        })
        .promise();

      const keys = (out.Contents || [])
        .map((o) => o.Key)
        .filter((k): k is string => Boolean(k && k.endsWith('.json')));

      const batch = await Promise.all(
        keys.map(async (key) => {
          try {
            const obj = await s3.getObject({ Bucket: bucket(), Key: key }).promise();
            if (!obj.Body) return null;
            return JSON.parse(obj.Body.toString()) as AnalyticsSessionMeta;
          } catch {
            return null;
          }
        })
      );

      for (const m of batch) {
        if (m && typeof m.sessionId === 'string' && typeof m.firstSeenAt === 'number') {
          metas.push(m);
        }
      }

      token = out.IsTruncated ? out.NextContinuationToken : undefined;
    } while (token);
  } catch (e) {
    console.error('[analytics] summary list', e);
    return res.status(500).json({ error: 'Failed to list analytics data' });
  }

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

  return res.status(200).json({
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
  });
}
