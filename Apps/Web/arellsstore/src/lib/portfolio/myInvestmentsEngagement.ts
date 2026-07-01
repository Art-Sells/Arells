import type AWS from 'aws-sdk';
import { normalizeEmailKey } from '../auth/normalize';
import { isS3WriteDisabled } from '../server/s3WriteGuard';

const DAY_MS = 86_400_000;
const ENGAGEMENT_ROLLING_DAYS = 7;

const BASE_PREFIX = 'analytics/myinv-engagement-v1';

/**
 * Engagement S3 storage: `false` = preview prefix (safe local + pre-launch deploys).
 * Set to `true` and deploy when real user earnings should read/write live data.
 */
export const MYINV_ENGAGEMENT_LIVE_STORAGE = true;

export type MyInvEngagementEventType = 'range_select' | 'toggle_flip' | 'section_expand';

/** Points per event — summed over rolling UTC window for earnings score. */
export const MYINV_ENGAGEMENT_EVENT_WEIGHTS: Record<MyInvEngagementEventType, number> = {
  range_select: 1,
  toggle_flip: 2,
  section_expand: 1,
};

export type MyInvEngagementDayCounts = {
  range_select: number;
  toggle_flip: number;
  section_expand: number;
  updatedAt: number;
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

export function isMyInvEngagementLive(): boolean {
  return MYINV_ENGAGEMENT_LIVE_STORAGE;
}

export type MyInvEngagementStorageMode = 'live' | 'preview';

export function myInvEngagementStorageMode(): MyInvEngagementStorageMode {
  return isMyInvEngagementLive() ? 'live' : 'preview';
}

/** Live prefix when MYINV_ENGAGEMENT_LIVE_STORAGE is true; otherwise `-preview/`. */
export function myInvEngagementS3Prefix(): string {
  if (isMyInvEngagementLive()) {
    return `${BASE_PREFIX}/`;
  }
  return `${BASE_PREFIX}-preview/`;
}

function dayObjectKey(dayKey: string, emailKey: string): string {
  return `${myInvEngagementS3Prefix()}${dayKey}/e:${emailKey}.json`;
}

function emptyCounts(updatedAt = Date.now()): MyInvEngagementDayCounts {
  return { range_select: 0, toggle_flip: 0, section_expand: 0, updatedAt };
}

export async function readEngagementDayCounts(
  s3: AWS.S3,
  bucket: string,
  dayKey: string,
  emailKey: string
): Promise<MyInvEngagementDayCounts> {
  const key = dayObjectKey(dayKey, emailKey);
  try {
    const obj = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    if (!obj.Body) return emptyCounts();
    const parsed = JSON.parse(obj.Body.toString()) as Partial<MyInvEngagementDayCounts>;
    return {
      range_select: Math.max(0, Number(parsed.range_select) || 0),
      toggle_flip: Math.max(0, Number(parsed.toggle_flip) || 0),
      section_expand: Math.max(0, Number(parsed.section_expand) || 0),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    };
  } catch (err: unknown) {
    const e = err as { code?: string; statusCode?: number };
    if (e.code === 'NoSuchKey' || e.statusCode === 404) return emptyCounts();
    throw err;
  }
}

export async function recordMyInvEngagementEvent(
  s3: AWS.S3,
  bucket: string,
  emailKey: string,
  eventType: MyInvEngagementEventType,
  nowMs: number = Date.now()
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (isS3WriteDisabled()) {
    return { ok: true, skipped: true };
  }

  const dayKey = isoDayKey(nowMs);
  const key = dayObjectKey(dayKey, emailKey);
  const prev = await readEngagementDayCounts(s3, bucket, dayKey, emailKey);
  const next: MyInvEngagementDayCounts = {
    ...prev,
    [eventType]: prev[eventType] + 1,
    updatedAt: nowMs,
  };

  await s3
    .putObject({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(next),
      ContentType: 'application/json',
      ACL: 'private',
    })
    .promise();

  return { ok: true };
}

function scoreFromCounts(counts: MyInvEngagementDayCounts): number {
  return (
    counts.range_select * MYINV_ENGAGEMENT_EVENT_WEIGHTS.range_select +
    counts.toggle_flip * MYINV_ENGAGEMENT_EVENT_WEIGHTS.toggle_flip +
    counts.section_expand * MYINV_ENGAGEMENT_EVENT_WEIGHTS.section_expand
  );
}

export async function getEngagementScoreForEmail(
  s3: AWS.S3,
  bucket: string,
  emailKey: string,
  nowMs: number = Date.now()
): Promise<number> {
  const dayKeys = eachUtcDay(nowMs - (ENGAGEMENT_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  let total = 0;
  for (const dayKey of dayKeys) {
    const counts = await readEngagementDayCounts(s3, bucket, dayKey, emailKey);
    total += scoreFromCounts(counts);
  }
  return total;
}

/** Engagement scores for verified users — direct per-user day reads (no prefix listing). */
export async function buildEngagementScoresByEmail(
  s3: AWS.S3,
  bucket: string,
  verifiedEmailKeys: Iterable<string>,
  nowMs: number = Date.now()
): Promise<Map<string, number>> {
  const keys = [...new Set(verifiedEmailKeys)];
  const dayKeys = eachUtcDay(nowMs - (ENGAGEMENT_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  const scores = new Map<string, number>();

  await Promise.all(
    keys.map(async (emailKey) => {
      const totals = emptyCounts();
      for (const dayKey of dayKeys) {
        const counts = await readEngagementDayCounts(s3, bucket, dayKey, emailKey);
        totals.range_select += counts.range_select;
        totals.toggle_flip += counts.toggle_flip;
        totals.section_expand += counts.section_expand;
        totals.updatedAt = Math.max(totals.updatedAt, counts.updatedAt);
      }
      scores.set(emailKey, scoreFromCounts(totals));
    })
  );

  return scores;
}

export function emailKeyFromEmail(email: string): string {
  return normalizeEmailKey(email);
}

export const ENGAGEMENT_ROLLING_DAYS_EXPORT = ENGAGEMENT_ROLLING_DAYS;
