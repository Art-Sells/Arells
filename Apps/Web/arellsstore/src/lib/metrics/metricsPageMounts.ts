import type AWS from 'aws-sdk';
import { normalizeAnalyticsPath } from '../analytics/pathUtils';

const DAY_MS = 86_400_000;

/** One empty-ish object per distinct actor per UTC day (written by POST /api/metrics/page-mount). */
export const METRICS_PAGE_MOUNTS_PREFIX = 'analytics/metrics-page-mounts-v1/';

export type MetricsPageActivityPayload = {
  generatedAt: number;
  pagePath: string;
  dau: number;
  wau: number;
  mau: number;
  utcToday: string;
  wauRollingDays: number;
  mauMonthStart: string;
};

function isoDayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function startOfUtcDay(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function eachUtcDay(fromMs: number, toMs: number): string[] {
  const keys: string[] = [];
  let t = startOfUtcDay(fromMs);
  const end = startOfUtcDay(toMs);
  while (t <= end) {
    keys.push(isoDayKey(t));
    t += DAY_MS;
  }
  return keys;
}

function startOfUtcMonth(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

export async function listMountDedupesForUtcDay(
  s3: AWS.S3,
  bucket: string,
  dayKey: string
): Promise<Set<string>> {
  const pref = `${METRICS_PAGE_MOUNTS_PREFIX}${dayKey}/`;
  const set = new Set<string>();
  let token: string | undefined;
  do {
    const out = await s3
      .listObjectsV2({ Bucket: bucket, Prefix: pref, ContinuationToken: token, MaxKeys: 1000 })
      .promise();
    for (const o of out.Contents ?? []) {
      const k = o.Key;
      if (!k || !k.startsWith(pref)) continue;
      const rest = k.slice(pref.length);
      if (!rest.endsWith('.json')) continue;
      const enc = rest.slice(0, -5);
      try {
        set.add(decodeURIComponent(enc));
      } catch {
        set.add(enc);
      }
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return set;
}

export async function aggregateMetricsPageMounts(
  s3: AWS.S3,
  bucket: string,
  nowMs: number
): Promise<Omit<MetricsPageActivityPayload, 'generatedAt' | 'pagePath'>> {
  const todayKey = isoDayKey(nowMs);
  const weekKeys = eachUtcDay(nowMs - 6 * DAY_MS, nowMs);
  const monthStart = startOfUtcMonth(nowMs);
  const monthKeys = eachUtcDay(monthStart, nowMs);

  const dauSetPromise = listMountDedupesForUtcDay(s3, bucket, todayKey);
  const weekSetsPromise = Promise.all(weekKeys.map((d) => listMountDedupesForUtcDay(s3, bucket, d)));
  const [dauSet, weekSets] = await Promise.all([dauSetPromise, weekSetsPromise]);

  const wauSet = new Set<string>();
  for (const s of weekSets) {
    for (const id of s) wauSet.add(id);
  }

  const monthSets = await Promise.all(monthKeys.map((d) => listMountDedupesForUtcDay(s3, bucket, d)));
  const mauSet = new Set<string>();
  for (const s of monthSets) {
    for (const id of s) mauSet.add(id);
  }

  return {
    dau: dauSet.size,
    wau: wauSet.size,
    mau: mauSet.size,
    utcToday: todayKey,
    wauRollingDays: 7,
    mauMonthStart: isoDayKey(monthStart),
  };
}

export function metricsActivityTargetPath(): string {
  const raw = process.env.METRICS_ACTIVITY_PAGE_PATH?.trim();
  if (!raw) return '/metrics';
  return normalizeAnalyticsPath(raw) ?? '/metrics';
}
