import type AWS from 'aws-sdk';
import { hashEmailForAnalytics } from '../analytics/userHash';
import { normalizeAnalyticsPath } from '../analytics/pathUtils';
import { listVerifiedUserS3Touches, type UserTouchMap } from './listUserS3Touches';

const DAY_MS = 86_400_000;

/** WAUt: distinct accounts active on any of the last 7 UTC days (inclusive). */
const WAU_ROLLING_DAYS = 7;

/** MAUt: distinct accounts active on any of the last 30 UTC days (inclusive). */
const MAU_ROLLING_DAYS = 30;

/** Per-day signed-in mounts from POST /api/metrics/page-mount. */
export const METRICS_PAGE_MOUNTS_PREFIX = 'analytics/metrics-page-mounts-v1/';

/** Mount keys: `e:{canonicalEmailKey}` (current) or legacy `h:{hash}`. Anonymous `s:` mounts are ignored. */
function isEmailMountDedupe(decodedFilenameStem: string): boolean {
  return decodedFilenameStem.startsWith('e:') || decodedFilenameStem.startsWith('h:');
}

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
      let dedupe: string;
      try {
        dedupe = decodeURIComponent(enc);
      } catch {
        dedupe = enc;
      }
      if (!isEmailMountDedupe(dedupe)) continue;
      set.add(dedupe);
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return set;
}

/** Discrete Auth/Vavity LastModified calendar days only (no span-fill). */
function userActivityDayKeys(ut: { authMs?: number; vavityMs?: number }): Set<string> {
  const days = new Set<string>();
  if (ut.authMs != null) days.add(isoDayKey(ut.authMs));
  if (ut.vavityMs != null) days.add(isoDayKey(ut.vavityMs));
  return days;
}

function userTouchesUtcDay(ut: { authMs?: number; vavityMs?: number }, dayKey: string): boolean {
  return userActivityDayKeys(ut).has(dayKey);
}

function collectAccountsActiveOnUtcDaySpan(touchMap: UserTouchMap, dayKey: string): Set<string> {
  const set = new Set<string>();
  for (const [emailKey, ut] of touchMap) {
    if (userTouchesUtcDay(ut, dayKey)) set.add(emailKey);
  }
  return set;
}

function buildHashToEmailKeyMap(touchMap: UserTouchMap): Map<string, string> {
  const map = new Map<string, string>();
  for (const [emailKey] of touchMap) {
    let email: string;
    try {
      email = decodeURIComponent(emailKey);
    } catch {
      continue;
    }
    const hash = hashEmailForAnalytics(email);
    if (hash) map.set(hash, emailKey);
  }
  return map;
}

function mountDedupeToEmailKey(dedupe: string, hashToEmail: Map<string, string>): string | null {
  if (dedupe.startsWith('e:')) return dedupe.slice(2);
  if (dedupe.startsWith('h:')) return hashToEmail.get(dedupe.slice(2)) ?? null;
  return null;
}

/**
 * Distinct accounts active on any of the given UTC days:
 * discrete S3 Auth/Vavity touch days + signed-in page-mount.
 */
async function collectAccountsActiveForUtcDays(
  s3: AWS.S3,
  bucket: string,
  touchMap: UserTouchMap,
  hashToEmail: Map<string, string>,
  dayKeys: string[]
): Promise<Set<string>> {
  const set = new Set<string>();
  for (const dayKey of dayKeys) {
    for (const emailKey of collectAccountsActiveOnUtcDaySpan(touchMap, dayKey)) {
      set.add(emailKey);
    }
    const mountSet = await listMountDedupesForUtcDay(s3, bucket, dayKey);
    for (const dedupe of mountSet) {
      const emailKey = mountDedupeToEmailKey(dedupe, hashToEmail);
      if (emailKey && touchMap.has(emailKey)) set.add(emailKey);
    }
  }
  return set;
}

/**
 * DAUt/WAUt/MAUt — verified accounts only (S3 touch days + page-mounts).
 */
export async function aggregateSignedInUserTraffic(
  s3: AWS.S3,
  bucket: string,
  nowMs: number
): Promise<Omit<MetricsPageActivityPayload, 'generatedAt' | 'pagePath'>> {
  const touchMap = await listVerifiedUserS3Touches(s3, bucket);
  const hashToEmail = buildHashToEmailKeyMap(touchMap);

  const todayKey = isoDayKey(nowMs);
  const yesterdayKey = isoDayKey(nowMs - DAY_MS);
  const wauKeys = eachUtcDay(nowMs - (WAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  const mauStartMs = nowMs - (MAU_ROLLING_DAYS - 1) * DAY_MS;
  const mauKeys = eachUtcDay(mauStartMs, nowMs);

  const [dauSet, wauSet, mauSet] = await Promise.all([
    collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, [yesterdayKey, todayKey]),
    collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, wauKeys),
    collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, mauKeys),
  ]);

  return {
    dau: dauSet.size,
    wau: wauSet.size,
    mau: mauSet.size,
    utcToday: todayKey,
    wauRollingDays: WAU_ROLLING_DAYS,
    mauMonthStart: isoDayKey(mauStartMs),
  };
}

/** Verified accounts active on any of the last 7 UTC days (portfolio referral “active weekly”). */
export async function listVerifiedWauActiveEmailKeys(
  s3: AWS.S3,
  bucket: string,
  nowMs: number = Date.now()
): Promise<Set<string>> {
  const touchMap = await listVerifiedUserS3Touches(s3, bucket);
  const hashToEmail = buildHashToEmailKeyMap(touchMap);
  const wauKeys = eachUtcDay(nowMs - (WAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  return collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, wauKeys);
}

export type MetricsActivityDebugAccount = {
  emailKey: string;
  authDay: string | null;
  vavityDay: string | null;
  activeToday: boolean;
  activeYesterday: boolean;
  activeLast7Days: boolean;
  activeLast30Days: boolean;
  mountDaysLast7: string[];
};

/** Dev-only breakdown of how DAUt/WAUt/MAUt are computed. */
export async function buildMetricsActivityDebug(
  s3: AWS.S3,
  bucket: string,
  nowMs: number
): Promise<{
  utcToday: string;
  registeredAccounts: number;
  dau: number;
  wau: number;
  mau: number;
  wauRollingDays: number;
  wauWindowDays: string[];
  accounts: MetricsActivityDebugAccount[];
}> {
  const touchMap = await listVerifiedUserS3Touches(s3, bucket);
  const hashToEmail = buildHashToEmailKeyMap(touchMap);
  const counts = await aggregateSignedInUserTraffic(s3, bucket, nowMs);
  const todayKey = isoDayKey(nowMs);
  const yesterdayKey = isoDayKey(nowMs - DAY_MS);
  const wauKeys = eachUtcDay(nowMs - (WAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  const mauKeys = eachUtcDay(nowMs - (MAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);

  const mountDaysByEmail = new Map<string, Set<string>>();
  for (const dayKey of wauKeys) {
    const mountSet = await listMountDedupesForUtcDay(s3, bucket, dayKey);
    for (const dedupe of mountSet) {
      const emailKey = mountDedupeToEmailKey(dedupe, hashToEmail);
      if (!emailKey) continue;
      if (!mountDaysByEmail.has(emailKey)) mountDaysByEmail.set(emailKey, new Set());
      mountDaysByEmail.get(emailKey)!.add(dayKey);
    }
  }

  const accounts: MetricsActivityDebugAccount[] = [];
  for (const [emailKey, ut] of touchMap) {
    accounts.push({
      emailKey,
      authDay: ut.authMs != null ? isoDayKey(ut.authMs) : null,
      vavityDay: ut.vavityMs != null ? isoDayKey(ut.vavityMs) : null,
      activeToday: userTouchesUtcDay(ut, todayKey),
      activeYesterday: userTouchesUtcDay(ut, yesterdayKey),
      activeLast7Days: wauKeys.some((d) => userTouchesUtcDay(ut, d)),
      activeLast30Days: mauKeys.some((d) => userTouchesUtcDay(ut, d)),
      mountDaysLast7: [...(mountDaysByEmail.get(emailKey) ?? [])].sort(),
    });
  }

  return {
    utcToday: todayKey,
    registeredAccounts: touchMap.size,
    dau: counts.dau,
    wau: counts.wau,
    mau: counts.mau,
    wauRollingDays: WAU_ROLLING_DAYS,
    wauWindowDays: wauKeys,
    accounts,
  };
}

/** Metrics-page mounts only (legacy path). */
export async function aggregateMetricsPageMounts(
  s3: AWS.S3,
  bucket: string,
  nowMs: number
): Promise<Omit<MetricsPageActivityPayload, 'generatedAt' | 'pagePath'>> {
  const todayKey = isoDayKey(nowMs);
  const wauKeys = eachUtcDay(nowMs - (WAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  const mauStartMs = nowMs - (MAU_ROLLING_DAYS - 1) * DAY_MS;
  const mauKeys = eachUtcDay(mauStartMs, nowMs);

  const dauSetPromise = listMountDedupesForUtcDay(s3, bucket, todayKey);
  const wauSetsPromise = Promise.all(wauKeys.map((d) => listMountDedupesForUtcDay(s3, bucket, d)));
  const [dauSet, wauSets] = await Promise.all([dauSetPromise, wauSetsPromise]);

  const wauSet = new Set<string>();
  for (const s of wauSets) {
    for (const id of s) wauSet.add(id);
  }

  const mauSets = await Promise.all(mauKeys.map((d) => listMountDedupesForUtcDay(s3, bucket, d)));
  const mauSet = new Set<string>();
  for (const s of mauSets) {
    for (const id of s) mauSet.add(id);
  }

  return {
    dau: dauSet.size,
    wau: wauSet.size,
    mau: mauSet.size,
    utcToday: todayKey,
    wauRollingDays: WAU_ROLLING_DAYS,
    mauMonthStart: isoDayKey(mauStartMs),
  };
}

export function metricsActivityTargetPath(): string {
  const raw = process.env.METRICS_ACTIVITY_PAGE_PATH?.trim();
  if (!raw) return '/metrics';
  return normalizeAnalyticsPath(raw) ?? '/metrics';
}
