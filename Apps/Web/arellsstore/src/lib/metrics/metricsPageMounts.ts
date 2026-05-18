import type AWS from 'aws-sdk';
import type { AnalyticsSessionMeta } from '../analytics/types';
import { hashEmailForAnalytics } from '../analytics/userHash';
import { loadAllSessionMetasFromS3 } from '../analytics/loadSessionMetasFromS3';
import { normalizeAnalyticsPath } from '../analytics/pathUtils';
import { listAllUserAuthAccountsFromS3, type UserTouchMap } from './listUserS3Touches';

const DAY_MS = 86_400_000;

/** WAUt window — matches Growth “1 Month” (30d), not calendar 7d. */
const WAU_ROLLING_DAYS = 30;

/** Per-day signed-in mounts from POST /api/metrics/page-mount (merged with beacon session-meta for DAUt/WAUt/MAUt). */
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

function sessionTouchesUtcDay(firstSeen: number, lastSeen: number, dayKey: string): boolean {
  const d0 = Date.parse(`${dayKey}T00:00:00.000Z`);
  const d1 = d0 + DAY_MS - 1;
  return firstSeen <= d1 && lastSeen >= d0;
}

function userSpanMs(ut: { authMs?: number; vavityMs?: number }): { min: number; max: number } | null {
  const times = [ut.authMs, ut.vavityMs].filter((t): t is number => t != null);
  if (!times.length) return null;
  return { min: Math.min(...times), max: Math.max(...times) };
}

/** S3 Auth/Vavity LastModified span overlaps this UTC calendar day (same rule for DAUt/WAUt/MAUt). */
function userTouchesUtcDay(ut: { authMs?: number; vavityMs?: number }, dayKey: string): boolean {
  const span = userSpanMs(ut);
  if (!span) return false;
  return sessionTouchesUtcDay(span.min, span.max, dayKey);
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
 * S3 touch span + signed-in page-mount + analytics session-meta (when enabled).
 */
async function collectAccountsActiveForUtcDays(
  s3: AWS.S3,
  bucket: string,
  touchMap: UserTouchMap,
  hashToEmail: Map<string, string>,
  metas: AnalyticsSessionMeta[],
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
    for (const m of metas) {
      if (!m.userHash || !sessionMetaActiveOnUtcDay(m, dayKey)) continue;
      const emailKey = hashToEmail.get(m.userHash);
      if (emailKey && touchMap.has(emailKey)) set.add(emailKey);
    }
  }
  return set;
}

/** Signed-in session active on a UTC day (open/pageview day keys, else firstSeen–lastSeen span). */
function sessionMetaActiveOnUtcDay(m: AnalyticsSessionMeta, dayKey: string): boolean {
  if (m.pageMountDayKeys?.includes(dayKey)) return true;
  return sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, dayKey);
}

function distinctSignedInUserHashesOnUtcDay(metas: AnalyticsSessionMeta[], dayKey: string): Set<string> {
  const set = new Set<string>();
  for (const m of metas) {
    const hash = m.userHash;
    if (!hash) continue;
    if (sessionMetaActiveOnUtcDay(m, dayKey)) set.add(hash);
  }
  return set;
}

/**
 * DAUt/WAUt/MAUt — same rules, different UTC windows (all from users/ + visits).
 * Active on a day = S3 Auth/Vavity span touches that day, or signed-in page-mount, or analytics meta.
 */
export async function aggregateSignedInUserTraffic(
  s3: AWS.S3,
  bucket: string,
  nowMs: number
): Promise<Omit<MetricsPageActivityPayload, 'generatedAt' | 'pagePath'>> {
  const [touchMap, metas] = await Promise.all([
    listAllUserAuthAccountsFromS3(s3, bucket),
    loadAllSessionMetasFromS3(s3, bucket),
  ]);
  const hashToEmail = buildHashToEmailKeyMap(touchMap);

  const todayKey = isoDayKey(nowMs);
  const yesterdayKey = isoDayKey(nowMs - DAY_MS);
  const wauKeys = eachUtcDay(nowMs - (WAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  const monthStart = startOfUtcMonth(nowMs);
  const monthKeys = eachUtcDay(monthStart, nowMs);

  const [dauSet, wauSet, mauSet] = await Promise.all([
    collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, metas, [
      yesterdayKey,
      todayKey,
    ]),
    collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, metas, wauKeys),
    collectAccountsActiveForUtcDays(s3, bucket, touchMap, hashToEmail, metas, monthKeys),
  ]);

  return {
    dau: dauSet.size,
    wau: wauSet.size,
    mau: mauSet.size,
    utcToday: todayKey,
    wauRollingDays: WAU_ROLLING_DAYS,
    mauMonthStart: isoDayKey(monthStart),
  };
}

export type MetricsActivityDebugAccount = {
  emailKey: string;
  authDay: string | null;
  vavityDay: string | null;
  activeToday: boolean;
  activeYesterday: boolean;
  activeLast30Days: boolean;
  activeThisMonth: boolean;
  mountDaysLast30: string[];
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
  const touchMap = await listAllUserAuthAccountsFromS3(s3, bucket);
  const hashToEmail = buildHashToEmailKeyMap(touchMap);
  const counts = await aggregateSignedInUserTraffic(s3, bucket, nowMs);
  const todayKey = isoDayKey(nowMs);
  const yesterdayKey = isoDayKey(nowMs - DAY_MS);
  const wauKeys = eachUtcDay(nowMs - (WAU_ROLLING_DAYS - 1) * DAY_MS, nowMs);
  const monthStart = startOfUtcMonth(nowMs);
  const monthKeys = eachUtcDay(monthStart, nowMs);

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
      activeLast30Days: wauKeys.some((d) => userTouchesUtcDay(ut, d)),
      activeThisMonth: monthKeys.some((d) => userTouchesUtcDay(ut, d)),
      mountDaysLast30: [...(mountDaysByEmail.get(emailKey) ?? [])].sort(),
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

/** Beacon session-meta only (no metrics-page-mount union). */
export async function aggregateSignedInUserTrafficFromSessionMeta(
  s3: AWS.S3,
  bucket: string,
  nowMs: number
): Promise<Omit<MetricsPageActivityPayload, 'generatedAt' | 'pagePath'>> {
  const metas = await loadAllSessionMetasFromS3(s3, bucket);
  const signedIn = metas.filter((m) => Boolean(m.userHash));

  const todayKey = isoDayKey(nowMs);
  const weekKeys = eachUtcDay(nowMs - 6 * DAY_MS, nowMs);
  const monthStart = startOfUtcMonth(nowMs);
  const monthKeys = eachUtcDay(monthStart, nowMs);

  const dau = distinctSignedInUserHashesOnUtcDay(signedIn, todayKey).size;

  const wauSet = new Set<string>();
  for (const dayKey of weekKeys) {
    for (const hash of distinctSignedInUserHashesOnUtcDay(signedIn, dayKey)) {
      wauSet.add(hash);
    }
  }

  const mauSet = new Set<string>();
  for (const dayKey of monthKeys) {
    for (const hash of distinctSignedInUserHashesOnUtcDay(signedIn, dayKey)) {
      mauSet.add(hash);
    }
  }

  return {
    dau,
    wau: wauSet.size,
    mau: mauSet.size,
    utcToday: todayKey,
    wauRollingDays: 7,
    mauMonthStart: isoDayKey(monthStart),
  };
}

/** Metrics-page mounts only (legacy path). */
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
