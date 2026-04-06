import type AWS from 'aws-sdk';
import { loadAllSessionMetasFromS3 } from '../analytics/loadSessionMetasFromS3';
import type { AnalyticsSessionMeta } from '../analytics/types';
import { countSessionAggregateKeys } from './countSessionKeysInS3';
import { listUserS3Touches, type UserTouchMap } from './listUserS3Touches';
import type {
  MetricsGrowthKpis,
  MetricsGrowthResponse,
  MetricsGrowthSeriesPoint,
  MetricsHeadlines,
  MetricsRange,
  MetricsSegment,
  MetricsView,
} from './types';

const DAY_MS = 86_400_000;

function isoDayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function startOfUtcDay(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function endOfUtcDay(ts: number): number {
  return startOfUtcDay(ts) + DAY_MS - 1;
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

function sessionTouchesUtcDay(firstSeen: number, lastSeen: number, dayKey: string): boolean {
  const d0 = Date.parse(`${dayKey}T00:00:00.000Z`);
  const d1 = d0 + DAY_MS - 1;
  return firstSeen <= d1 && lastSeen >= d0;
}

function filterMetas(metas: AnalyticsSessionMeta[], segment: MetricsSegment): AnalyticsSessionMeta[] {
  if (segment === 'sessions') return metas.filter((m) => !m.userHash);
  if (segment === 'signed_in') return metas.filter((m) => Boolean(m.userHash));
  return metas;
}

/** For S3 user touches: span from earliest to latest LM (proxy for “active across days”). */
function userSpanMs(ut: { authMs?: number; vavityMs?: number }): { min: number; max: number } | null {
  const times = [ut.authMs, ut.vavityMs].filter((t): t is number => t != null);
  if (!times.length) return null;
  return { min: Math.min(...times), max: Math.max(...times) };
}

function userTouchesUtcDay(ut: { authMs?: number; vavityMs?: number }, dayKey: string): boolean {
  const span = userSpanMs(ut);
  if (!span) return false;
  return sessionTouchesUtcDay(span.min, span.max, dayKey);
}

function countUsersActiveOnDay(touchMap: UserTouchMap, dayKey: string): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    if (userTouchesUtcDay(ut, dayKey)) n += 1;
  }
  return n;
}

function strictSessionDau(m: AnalyticsSessionMeta, rangeStart: number, rangeEnd: number): boolean {
  const days = eachUtcDay(rangeStart, rangeEnd);
  if (!days.length) return false;
  return days.every((d) => sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, d));
}

function strictSessionWau(m: AnalyticsSessionMeta, rangeStart: number, rangeEnd: number): boolean {
  const weeks = weekBucketsUtcSimple(rangeStart, rangeEnd);
  return weeks.every(({ wStart, wEnd }) => m.lastSeenAt >= wStart && m.firstSeenAt <= wEnd);
}

function strictSessionMau(m: AnalyticsSessionMeta, rangeStart: number, rangeEnd: number): boolean {
  const months = monthBucketsUtc(rangeStart, rangeEnd);
  return months.every(({ mStart, mEnd }) => m.lastSeenAt >= mStart && m.firstSeenAt <= mEnd);
}

/** Monday 00:00 UTC of the week containing `ts`. */
function utcMondayAtOrBefore(ts: number): number {
  const sod = startOfUtcDay(ts);
  const dow = new Date(sod).getUTCDay();
  const daysSinceMonday = (dow + 6) % 7;
  return sod - daysSinceMonday * DAY_MS;
}

function weekBucketsUtcSimple(
  rangeStart: number,
  rangeEnd: number
): Array<{ label: string; wStart: number; wEnd: number }> {
  const out: Array<{ label: string; wStart: number; wEnd: number }> = [];
  let w = utcMondayAtOrBefore(rangeStart);
  const end = startOfUtcDay(rangeEnd);
  while (w <= end) {
    const wEnd = w + 7 * DAY_MS - 1;
    const label = `W ${isoDayKey(w)}`;
    if (wEnd >= rangeStart && w <= rangeEnd) {
      out.push({ label, wStart: w, wEnd });
    }
    w += 7 * DAY_MS;
  }
  return out;
}

function monthBucketsUtc(
  rangeStart: number,
  rangeEnd: number
): Array<{ label: string; mStart: number; mEnd: number }> {
  const out: Array<{ label: string; mStart: number; mEnd: number }> = [];
  let y = new Date(rangeStart).getUTCFullYear();
  let mo = new Date(rangeStart).getUTCMonth();
  const endT = rangeEnd;
  for (let guard = 0; guard < 2400; guard++) {
    const mStart = Date.UTC(y, mo, 1);
    const mEnd = Date.UTC(y, mo + 1, 1) - 1;
    if (mEnd >= rangeStart && mStart <= endT) {
      out.push({ label: `${y}-${String(mo + 1).padStart(2, '0')}`, mStart, mEnd });
    }
    if (mStart > endT) break;
    mo += 1;
    if (mo > 11) {
      mo = 0;
      y += 1;
    }
  }
  return out;
}

function strictUserSpanCovers(
  ut: { authMs?: number; vavityMs?: number },
  rangeStart: number,
  rangeEnd: number,
  mode: 'dau' | 'wau' | 'mau'
): boolean {
  const span = userSpanMs(ut);
  if (!span) return false;
  if (mode === 'dau') {
    return eachUtcDay(rangeStart, rangeEnd).every((d) => sessionTouchesUtcDay(span.min, span.max, d));
  }
  if (mode === 'wau') {
    return weekBucketsUtcSimple(rangeStart, rangeEnd).every(
      ({ wStart, wEnd }) => span.max >= wStart && span.min <= wEnd
    );
  }
  return monthBucketsUtc(rangeStart, rangeEnd).every(({ mStart, mEnd }) => span.max >= mStart && span.min <= mEnd);
}

function spanOverlapsRange(startMs: number, endMs: number, rangeStart: number, rangeEnd: number): boolean {
  return endMs >= rangeStart && startMs <= rangeEnd;
}

function countAauSessionsAnalytic(
  metas: AnalyticsSessionMeta[],
  rangeStart: number,
  rangeEnd: number,
  seg: MetricsSegment
): number {
  const filtered = filterMetas(metas, seg === 'all' ? 'all' : seg);
  const set = new Set<string>();
  for (const m of filtered) {
    if (spanOverlapsRange(m.firstSeenAt, m.lastSeenAt, rangeStart, rangeEnd)) set.add(m.sessionId);
  }
  return set.size;
}

function countAauUsersS3(touchMap: UserTouchMap, rangeStart: number, rangeEnd: number): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span && spanOverlapsRange(span.min, span.max, rangeStart, rangeEnd)) n += 1;
  }
  return n;
}

function countStrictUsers(touchMap: UserTouchMap, rangeStart: number, rangeEnd: number, mode: 'dau' | 'wau' | 'mau'): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    if (strictUserSpanCovers(ut, rangeStart, rangeEnd, mode)) n += 1;
  }
  return n;
}

function countStrictSessions(metas: AnalyticsSessionMeta[], rangeStart: number, rangeEnd: number, mode: 'dau' | 'wau' | 'mau'): number {
  let n = 0;
  for (const m of metas) {
    if (mode === 'dau' && strictSessionDau(m, rangeStart, rangeEnd)) n += 1;
    else if (mode === 'wau' && strictSessionWau(m, rangeStart, rangeEnd)) n += 1;
    else if (mode === 'mau' && strictSessionMau(m, rangeStart, rangeEnd)) n += 1;
  }
  return n;
}

function computeRangeBounds(
  range: MetricsRange,
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap
): { start: number; end: number } {
  const end = Date.now();
  if (range === '1w') return { start: end - 7 * DAY_MS, end };
  if (range === '1m') return { start: end - 30 * DAY_MS, end };
  if (range === '3m') return { start: end - 90 * DAY_MS, end };
  if (range === '1y') return { start: end - 365 * DAY_MS, end };

  let minT = end;
  for (const m of metas) {
    minT = Math.min(minT, m.firstSeenAt);
  }
  for (const [, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span) minT = Math.min(minT, span.min);
  }
  if (minT >= end) minT = end - DAY_MS;
  return { start: minT, end };
}

function buildGrowthSeriesDaily(
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap,
  segment: MetricsSegment,
  rangeStart: number,
  rangeEnd: number
): MetricsGrowthSeriesPoint[] {
  const days = eachUtcDay(rangeStart, rangeEnd);
  const metaForSessions =
    segment === 'signed_in' ? metas.filter((m) => Boolean(m.userHash)) : segment === 'sessions' ? filterMetas(metas, 'sessions') : metas;

  return days.map((d) => {
    let sessions = 0;
    if (segment !== 'signed_in') {
      const seen = new Set<string>();
      for (const m of metaForSessions) {
        if (sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, d) && !seen.has(m.sessionId)) {
          seen.add(m.sessionId);
          sessions += 1;
        }
      }
    }
    let signedInUsers = 0;
    if (segment !== 'sessions') {
      signedInUsers = countUsersActiveOnDay(touchMap, d);
    }
    const combined = sessions + signedInUsers;
    return { label: d, key: d, sessions, signedInUsers, combined };
  });
}

function buildGrowthSeriesWeekly(
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap,
  segment: MetricsSegment,
  rangeStart: number,
  rangeEnd: number
): MetricsGrowthSeriesPoint[] {
  const weeks = weekBucketsUtcSimple(rangeStart, rangeEnd);
  const metaForSessions =
    segment === 'signed_in' ? metas.filter((m) => Boolean(m.userHash)) : segment === 'sessions' ? filterMetas(metas, 'sessions') : metas;

  return weeks.map(({ label, wStart, wEnd }) => {
    let sessions = 0;
    if (segment !== 'signed_in') {
      const seen = new Set<string>();
      for (const m of metaForSessions) {
        if (m.lastSeenAt >= wStart && m.firstSeenAt <= wEnd && !seen.has(m.sessionId)) {
          seen.add(m.sessionId);
          sessions += 1;
        }
      }
    }
    let signedInUsers = 0;
    if (segment !== 'sessions') {
      for (const [, ut] of touchMap) {
        const span = userSpanMs(ut);
        if (span && span.max >= wStart && span.min <= wEnd) signedInUsers += 1;
      }
    }
    return { label, key: label, sessions, signedInUsers, combined: sessions + signedInUsers };
  });
}

function sumSeriesTail(series: MetricsGrowthSeriesPoint[], n: number, field: 'sessions' | 'signedInUsers' | 'combined'): number {
  const slice = series.slice(-n);
  return slice.reduce((a, p) => a + (p[field] || 0), 0);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function computeWowMom(
  series: MetricsGrowthSeriesPoint[],
  bucket: 'day' | 'week',
  segment: MetricsSegment
): { wow: number | null; mom: number | null; yoy: number | null } {
  const field: 'sessions' | 'signedInUsers' | 'combined' =
    segment === 'sessions' ? 'sessions' : segment === 'signed_in' ? 'signedInUsers' : 'combined';

  if (bucket === 'day' && series.length >= 14) {
    const last7 = sumSeriesTail(series, 7, field);
    const prev7 = sumSeriesTail(series.slice(0, -7), 7, field);
    const wow = pctChange(last7, prev7);
    const last30 = sumSeriesTail(series, 30, field);
    const prev30 = sumSeriesTail(series.slice(0, -30), 30, field);
    const mom = series.length >= 60 ? pctChange(last30, prev30) : null;
    const last365 = sumSeriesTail(series, 365, field);
    const prev365 = sumSeriesTail(series.slice(0, -365), 365, field);
    const yoy = series.length >= 730 ? pctChange(last365, prev365) : null;
    return { wow, mom, yoy };
  }
  if (bucket === 'week' && series.length >= 2) {
    const last = series[series.length - 1][field] || 0;
    const prev = series[series.length - 2][field] || 0;
    return { wow: pctChange(last, prev), mom: null, yoy: null };
  }
  return { wow: null, mom: null, yoy: null };
}

function sessionRetentionHalves(
  metas: AnalyticsSessionMeta[],
  rangeStart: number,
  rangeEnd: number
): { cohort: number; retained: number; rate: number | null } {
  const days = eachUtcDay(rangeStart, rangeEnd);
  if (days.length < 2) return { cohort: 0, retained: 0, rate: null };
  const mid = Math.floor(days.length / 2);
  const firstDays = new Set(days.slice(0, mid));
  const secondDays = new Set(days.slice(mid));
  const cohort = new Set<string>();
  for (const m of metas) {
    for (const d of firstDays) {
      if (sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, d)) {
        cohort.add(m.sessionId);
        break;
      }
    }
  }
  let retained = 0;
  for (const sid of cohort) {
    const m = metas.find((x) => x.sessionId === sid);
    if (!m) continue;
    for (const d of secondDays) {
      if (sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, d)) {
        retained += 1;
        break;
      }
    }
  }
  const rate = cohort.size === 0 ? null : (retained / cohort.size) * 100;
  return { cohort: cohort.size, retained, rate };
}

function userRetentionHalves(touchMap: UserTouchMap, rangeStart: number, rangeEnd: number): { cohort: number; retained: number; rate: number | null } {
  const days = eachUtcDay(rangeStart, rangeEnd);
  if (days.length < 2) return { cohort: 0, retained: 0, rate: null };
  const mid = Math.floor(days.length / 2);
  const firstDays = days.slice(0, mid);
  const secondDays = days.slice(mid);
  const cohort = new Set<string>();
  for (const [emailKey, ut] of touchMap) {
    if (firstDays.some((d) => userTouchesUtcDay(ut, d))) cohort.add(emailKey);
  }
  let retained = 0;
  for (const emailKey of cohort) {
    const ut = touchMap.get(emailKey);
    if (!ut) continue;
    if (secondDays.some((d) => userTouchesUtcDay(ut, d))) retained += 1;
  }
  const rate = cohort.size === 0 ? null : (retained / cohort.size) * 100;
  return { cohort: cohort.size, retained, rate };
}

function buildRetentionSeries(
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap,
  segment: MetricsSegment,
  rangeStart: number,
  rangeEnd: number,
  bucket: 'day' | 'week'
): MetricsGrowthSeriesPoint[] {
  if (bucket === 'day') {
    const days = eachUtcDay(rangeStart, rangeEnd);
    if (days.length < 2) return [];
    const cohortSessions = new Set<string>();
    const cohortUsers = new Set<string>();
    const d0 = days[0];
    for (const m of metas) {
      if (sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, d0)) cohortSessions.add(m.sessionId);
    }
    for (const [ek, ut] of touchMap) {
      if (userTouchesUtcDay(ut, d0)) cohortUsers.add(ek);
    }

    return days.map((d) => {
      let sessRet = 0;
      for (const sid of cohortSessions) {
        const m = metas.find((x) => x.sessionId === sid);
        if (m && sessionTouchesUtcDay(m.firstSeenAt, m.lastSeenAt, d)) sessRet += 1;
      }
      let userRet = 0;
      for (const ek of cohortUsers) {
        const ut = touchMap.get(ek);
        if (ut && userTouchesUtcDay(ut, d)) userRet += 1;
      }
      const cohortN =
        segment === 'sessions'
          ? cohortSessions.size
          : segment === 'signed_in'
            ? cohortUsers.size
            : cohortSessions.size + cohortUsers.size;
      const retN =
        segment === 'sessions' ? sessRet : segment === 'signed_in' ? userRet : sessRet + userRet;
      const retentionPct = cohortN === 0 ? null : (retN / cohortN) * 100;
      return {
        label: d,
        key: d,
        sessions: sessRet,
        signedInUsers: userRet,
        combined: retN,
        retentionPct,
      };
    });
  }

  const weeks = weekBucketsUtcSimple(rangeStart, rangeEnd);
  if (weeks.length < 2) return [];
  const w0 = weeks[0];
  const cohortSessions = new Set<string>();
  const cohortUsers = new Set<string>();
  for (const m of metas) {
    if (m.lastSeenAt >= w0.wStart && m.firstSeenAt <= w0.wEnd) cohortSessions.add(m.sessionId);
  }
  for (const [ek, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span && span.max >= w0.wStart && span.min <= w0.wEnd) cohortUsers.add(ek);
  }

  return weeks.map(({ label, wStart, wEnd }) => {
    let sessRet = 0;
    for (const sid of cohortSessions) {
      const m = metas.find((x) => x.sessionId === sid);
      if (m && m.lastSeenAt >= wStart && m.firstSeenAt <= wEnd) sessRet += 1;
    }
    let userRet = 0;
    for (const ek of cohortUsers) {
      const ut = touchMap.get(ek);
      const span = ut ? userSpanMs(ut) : null;
      if (span && span.max >= wStart && span.min <= wEnd) userRet += 1;
    }
    const cohortN =
      segment === 'sessions'
        ? cohortSessions.size
        : segment === 'signed_in'
          ? cohortUsers.size
          : cohortSessions.size + cohortUsers.size;
    const retN =
      segment === 'sessions' ? sessRet : segment === 'signed_in' ? userRet : sessRet + userRet;
    const retentionPct = cohortN === 0 ? null : (retN / cohortN) * 100;
    return {
      label,
      key: label,
      sessions: sessRet,
      signedInUsers: userRet,
      combined: retN,
      retentionPct,
    };
  });
}

export async function buildGrowthPayload(
  s3: AWS.S3,
  bucket: string,
  range: MetricsRange,
  segment: MetricsSegment,
  view: MetricsView
): Promise<MetricsGrowthResponse> {
  const notes: string[] = [
    'Sessions use analytics/session-meta (firstSeenAt–lastSeenAt). Signed-in users use users/*/Auth.json and users/*/VavityAggregate.json LastModified span as a proxy (not per-event logs).',
    'When segment is “all”, combined = sessions + S3 users and may double-count the same person.',
    'Strict DAU/WAU/MAU require the activity span to cover every day/week/month in the selected range.',
  ];

  const [metasAll, touchMap, registeredSessionKeys] = await Promise.all([
    loadAllSessionMetasFromS3(s3, bucket),
    listUserS3Touches(s3, bucket),
    countSessionAggregateKeys(s3, bucket),
  ]);

  const registeredUserKeys = touchMap.size;
  const registeredCombined = registeredUserKeys + registeredSessionKeys;

  const { start: rangeStart, end: rangeEnd } = computeRangeBounds(range, metasAll, touchMap);

  const aauSessionsAnonymous = countAauSessionsAnalytic(metasAll, rangeStart, rangeEnd, 'sessions');
  const aauSessionsAny = countAauSessionsAnalytic(metasAll, rangeStart, rangeEnd, 'all');
  const aauSignedInSessions = countAauSessionsAnalytic(metasAll, rangeStart, rangeEnd, 'signed_in');
  const aauUsers = countAauUsersS3(touchMap, rangeStart, rangeEnd);
  const aauCombined = aauSessionsAny + aauUsers;
  const spanDays = Math.max(1, (rangeEnd - rangeStart) / DAY_MS);
  const useWeekBuckets = spanDays > 120;
  const bucketType: 'day' | 'week' = useWeekBuckets ? 'week' : 'day';

  const metasForStrictSessions = filterMetas(metasAll, segment === 'all' ? 'all' : segment);

  let series: MetricsGrowthSeriesPoint[];
  if (view === 'retention') {
    series = buildRetentionSeries(metasAll, touchMap, segment, rangeStart, rangeEnd, bucketType);
  } else if (bucketType === 'week') {
    series = buildGrowthSeriesWeekly(metasAll, touchMap, segment, rangeStart, rangeEnd);
  } else {
    series = buildGrowthSeriesDaily(metasAll, touchMap, segment, rangeStart, rangeEnd);
  }

  const { wow, mom, yoy } = computeWowMom(series, bucketType, segment);

  const strictSessionDau = countStrictSessions(metasForStrictSessions, rangeStart, rangeEnd, 'dau');
  const strictSessionWau = countStrictSessions(metasForStrictSessions, rangeStart, rangeEnd, 'wau');
  const strictSessionMau = countStrictSessions(metasForStrictSessions, rangeStart, rangeEnd, 'mau');

  const strictUserDau =
    segment === 'sessions' ? 0 : countStrictUsers(touchMap, rangeStart, rangeEnd, 'dau');
  const strictUserWau =
    segment === 'sessions' ? 0 : countStrictUsers(touchMap, rangeStart, rangeEnd, 'wau');
  const strictUserMau =
    segment === 'sessions' ? 0 : countStrictUsers(touchMap, rangeStart, rangeEnd, 'mau');

  const sr = sessionRetentionHalves(
    segment === 'signed_in' ? metasAll.filter((m) => m.userHash) : segment === 'sessions' ? filterMetas(metasAll, 'sessions') : metasAll,
    rangeStart,
    rangeEnd
  );
  const ur = userRetentionHalves(touchMap, rangeStart, rangeEnd);

  let retentionCohortSize = 0;
  let retentionRetained = 0;
  let retentionRatePct: number | null = null;
  if (segment === 'sessions') {
    retentionCohortSize = sr.cohort;
    retentionRetained = sr.retained;
    retentionRatePct = sr.rate;
  } else if (segment === 'signed_in') {
    retentionCohortSize = ur.cohort;
    retentionRetained = ur.retained;
    retentionRatePct = ur.rate;
  } else {
    retentionCohortSize = sr.cohort + ur.cohort;
    retentionRetained = sr.retained + ur.retained;
    retentionRatePct =
      retentionCohortSize === 0 ? null : (retentionRetained / retentionCohortSize) * 100;
  }

  const kpis: MetricsGrowthKpis = {
    wowPct: wow,
    momPct: mom,
    yoyPct: yoy,
    strictSessionDau,
    strictSessionWau,
    strictSessionMau,
    strictUserDau,
    strictUserWau,
    strictUserMau,
    retentionCohortSize,
    retentionRetained,
    retentionRatePct,
  };

  let growthLabel: MetricsHeadlines['growthLabel'] = null;
  let growthPct: number | null = null;
  if (wow != null) {
    growthLabel = 'WoW';
    growthPct = wow;
  } else if (mom != null) {
    growthLabel = 'MoM';
    growthPct = mom;
  } else if (yoy != null) {
    growthLabel = 'YoY';
    growthPct = yoy;
  }

  const headlines: MetricsHeadlines = {
    registeredUserKeys,
    registeredSessionKeys,
    registeredCombined,
    aauUsers,
    aauSessionsAnonymous,
    aauSignedInSessions,
    aauCombined,
    growthLabel,
    growthPct,
  };

  return {
    generatedAt: Date.now(),
    range,
    segment,
    view,
    rangeStart,
    rangeEnd,
    bucket: bucketType,
    series,
    kpis,
    headlines,
    notes,
  };
}
