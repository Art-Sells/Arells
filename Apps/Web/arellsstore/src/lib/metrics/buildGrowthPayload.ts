import type AWS from 'aws-sdk';
import { loadAllSessionMetasFromS3 } from '../analytics/loadSessionMetasFromS3';
import type { AnalyticsSessionMeta } from '../analytics/types';
import { countSessionAggregateKeys } from './countSessionKeysInS3';
import { listSessionAggregatesFromS3, type SessionAggregateRow } from './listSessionAggregatesFromS3';
import {
  listAllUserAuthAccountsFromS3,
  listVerifiedUserS3Touches,
  type UserTouchMap,
} from './listUserS3Touches';
import type {
  MetricsGrowthKpis,
  MetricsGrowthResponse,
  MetricsGrowthSeriesPoint,
  MetricsHeadlines,
  MetricsRange,
  MetricsRangePresetsAvailable,
  MetricsSegment,
  MetricsView,
} from './types';

const DAY_MS = 86_400_000;

/** UTC midnight of first day included in metrics; rolling windows never start before this. */
function getMetricsEpochStartMs(): number {
  const raw = typeof process !== 'undefined' ? process.env.METRICS_EPOCH_START_UTC?.trim() : '';
  if (raw) {
    const parsed = Date.parse(`${raw}T00:00:00.000Z`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.UTC(2026, 3, 1);
}

function clampRangeToMetricsEpoch(start: number, end: number): { start: number; end: number } {
  const epochStart = getMetricsEpochStartMs();
  if (end < epochStart) {
    return { start: end, end };
  }
  const s = Math.max(start, epochStart);
  if (s > end) {
    return { start: end, end };
  }
  return { start: s, end };
}

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

function sessionOverlapsUtcRange(m: AnalyticsSessionMeta, rStart: number, rEnd: number): boolean {
  return m.lastSeenAt >= rStart && m.firstSeenAt <= rEnd;
}

function userOverlapsUtcRange(
  ut: { authMs?: number; vavityMs?: number },
  rStart: number,
  rEnd: number
): boolean {
  const span = userSpanMs(ut);
  if (!span) return false;
  return span.max >= rStart && span.min <= rEnd;
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

/** Users whose first S3 touch is on or before end of this UTC calendar day (series does not drop when idle). */
function countUsersCumulativeThroughUtcDayEnd(touchMap: UserTouchMap, dayKey: string): number {
  const endMs = Date.parse(`${dayKey}T23:59:59.999Z`);
  if (Number.isNaN(endMs)) return 0;
  let n = 0;
  for (const [, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span && span.min <= endMs) n += 1;
  }
  return n;
}

function countUsersCumulativeThroughMs(touchMap: UserTouchMap, endMsInclusive: number): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span && span.min <= endMsInclusive) n += 1;
  }
  return n;
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

/** Anonymous browsing: analytics/session-meta (no userHash) plus sessions/{id}/VavityAggregate when meta file is missing. */
function countAnonymousBrowsingInRange(
  metas: AnalyticsSessionMeta[],
  aggregates: SessionAggregateRow[],
  rangeStart: number,
  rangeEnd: number
): number {
  const metaById = new Map(metas.map((m) => [m.sessionId, m]));
  const counted = new Set<string>();
  for (const m of filterMetas(metas, 'sessions')) {
    if (spanOverlapsRange(m.firstSeenAt, m.lastSeenAt, rangeStart, rangeEnd)) counted.add(m.sessionId);
  }
  for (const { sessionId, lastModifiedMs } of aggregates) {
    if (counted.has(sessionId)) continue;
    if (metaById.has(sessionId)) continue;
    if (spanOverlapsRange(lastModifiedMs, lastModifiedMs, rangeStart, rangeEnd)) counted.add(sessionId);
  }
  return counted.size;
}

/** All sessions overlapping range, including VavityAggregate-only rows (no session-meta). */
function countAllSessionsInRangeWithS3Orphans(
  metas: AnalyticsSessionMeta[],
  aggregates: SessionAggregateRow[],
  rangeStart: number,
  rangeEnd: number
): number {
  const metaById = new Map(metas.map((m) => [m.sessionId, m]));
  const counted = new Set<string>();
  for (const m of metas) {
    if (spanOverlapsRange(m.firstSeenAt, m.lastSeenAt, rangeStart, rangeEnd)) counted.add(m.sessionId);
  }
  for (const { sessionId, lastModifiedMs } of aggregates) {
    if (counted.has(sessionId)) continue;
    if (metaById.has(sessionId)) continue;
    if (spanOverlapsRange(lastModifiedMs, lastModifiedMs, rangeStart, rangeEnd)) counted.add(sessionId);
  }
  return counted.size;
}

function applyS3OrphanBrowsingToDailySeries(
  series: MetricsGrowthSeriesPoint[],
  segment: MetricsSegment,
  metas: AnalyticsSessionMeta[],
  aggregates: SessionAggregateRow[],
  rangeStart: number,
  rangeEnd: number
): MetricsGrowthSeriesPoint[] {
  if (segment === 'signed_in' || !series.length) return series;
  const metaById = new Map(metas.map((m) => [m.sessionId, m]));
  const orphanByDay = new Map<string, Set<string>>();
  const daySet = new Set(series.map((p) => p.label));

  for (const row of aggregates) {
    if (metaById.has(row.sessionId)) continue;
    if (!spanOverlapsRange(row.lastModifiedMs, row.lastModifiedMs, rangeStart, rangeEnd)) continue;
    const dk = isoDayKey(row.lastModifiedMs);
    if (!daySet.has(dk)) continue;
    let s = orphanByDay.get(dk);
    if (!s) {
      s = new Set();
      orphanByDay.set(dk, s);
    }
    s.add(row.sessionId);
  }

  return series.map((p) => {
    const n = orphanByDay.get(p.label)?.size ?? 0;
    if (n === 0) return p;
    const sessions = p.sessions + n;
    return { ...p, sessions, combined: sessions + p.signedInUsers };
  });
}

/**
 * Minimal session-meta for sessions/{id}/VavityAggregate when analytics JSON is missing.
 * Span runs through rangeEnd so growth/orphan session counts aren’t 0 when S3 only gives one timestamp.
 */
function mergeSessionMetasWithAggregateFallback(
  metas: AnalyticsSessionMeta[],
  aggregates: SessionAggregateRow[],
  rangeStart: number,
  rangeEnd: number
): AnalyticsSessionMeta[] {
  const ids = new Set(metas.map((m) => m.sessionId));
  const extra: AnalyticsSessionMeta[] = [];
  for (const row of aggregates) {
    if (ids.has(row.sessionId)) continue;
    const ts = row.lastModifiedMs;
    // If LastModified is after the window, clamping ts to rangeEnd collapses first/last to one instant
    // so the session never touches earlier days → empty cohort / 0% retention. Span the full window instead.
    const t0 =
      ts > rangeEnd
        ? rangeStart
        : Math.min(Math.max(ts, rangeStart), rangeEnd);
    extra.push({
      sessionId: row.sessionId,
      firstSeenAt: t0,
      lastSeenAt: rangeEnd,
      lastIp: '',
      userAgent: '',
      heartbeatCount: 0,
      pageviewCount: 0,
      paths: [],
      userHash: null,
    });
  }
  return metas.concat(extra);
}

/**
 * S3 only exposes one or two LastModified timestamps per user; when min === max the user “exists” on a
 * single UTC day and retention falls to 0. For retention view only, extend through rangeEnd (same idea as
 * aggregate-only sessions) so the chart reflects presence in the selected window.
 */
function widenSingleInstantUserTouchesForRetention(
  touchMap: UserTouchMap,
  rangeStart: number,
  rangeEnd: number
): UserTouchMap {
  const out = new Map<string, { authMs?: number; vavityMs?: number }>();
  for (const [k, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (!span) continue;
    if (span.min === span.max) {
      const t0 = Math.min(Math.max(span.min, rangeStart), rangeEnd);
      out.set(k, { authMs: t0, vavityMs: rangeEnd });
    } else {
      out.set(k, { ...ut });
    }
  }
  return out;
}

function cohortUsersOnUtcDay(touchMap: UserTouchMap, dayKey: string): Set<string> {
  const cohortUsers = new Set<string>();
  for (const [ek, ut] of touchMap) {
    if (userTouchesUtcDay(ut, dayKey)) cohortUsers.add(ek);
  }
  return cohortUsers;
}

function cohortUsersOnUtcWeek(touchMap: UserTouchMap, w: { wStart: number; wEnd: number }): Set<string> {
  const cohortUsers = new Set<string>();
  for (const [ek, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span && span.max >= w.wStart && span.min <= w.wEnd) cohortUsers.add(ek);
  }
  return cohortUsers;
}

function applyS3OrphanBrowsingToWeeklySeries(
  series: MetricsGrowthSeriesPoint[],
  segment: MetricsSegment,
  metas: AnalyticsSessionMeta[],
  aggregates: SessionAggregateRow[],
  rangeStart: number,
  rangeEnd: number
): MetricsGrowthSeriesPoint[] {
  if (segment === 'signed_in' || !series.length) return series;
  const metaById = new Map(metas.map((m) => [m.sessionId, m]));
  const weeks = weekBucketsUtcSimple(rangeStart, rangeEnd);
  const byLabel = new Map<string, Set<string>>();

  for (const row of aggregates) {
    if (metaById.has(row.sessionId)) continue;
    if (!spanOverlapsRange(row.lastModifiedMs, row.lastModifiedMs, rangeStart, rangeEnd)) continue;
    const wk = weeks.find((w) => row.lastModifiedMs >= w.wStart && row.lastModifiedMs <= w.wEnd);
    if (!wk) continue;
    let s = byLabel.get(wk.label);
    if (!s) {
      s = new Set();
      byLabel.set(wk.label, s);
    }
    s.add(row.sessionId);
  }

  return series.map((p) => {
    const n = byLabel.get(p.label)?.size ?? 0;
    if (n === 0) return p;
    const sessions = p.sessions + n;
    return { ...p, sessions, combined: sessions + p.signedInUsers };
  });
}

function countAauUsersS3(touchMap: UserTouchMap, rangeStart: number, rangeEnd: number): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    const span = userSpanMs(ut);
    if (span && spanOverlapsRange(span.min, span.max, rangeStart, rangeEnd)) n += 1;
  }
  return n;
}

function computeRangeBounds(range: MetricsRange): { start: number; end: number } {
  const end = Date.now();
  if (range === '1w') return clampRangeToMetricsEpoch(end - 7 * DAY_MS, end);
  if (range === '1m') return clampRangeToMetricsEpoch(end - 30 * DAY_MS, end);
  if (range === '3m') return clampRangeToMetricsEpoch(end - 90 * DAY_MS, end);
  if (range === '1y') return clampRangeToMetricsEpoch(end - 365 * DAY_MS, end);

  // "All" = full metrics window from launch epoch through now — same x-axis origin as clamped 1W/1M/3M/1Y,
  // not the first data timestamp (which made All start on e.g. Apr 6 while presets started Apr 2).
  return clampRangeToMetricsEpoch(getMetricsEpochStartMs(), end);
}

const PRESET_MIN_SPAN: Record<Exclude<MetricsRange, 'all'>, number> = {
  '1w': 7 * DAY_MS,
  '1m': 30 * DAY_MS,
  '3m': 90 * DAY_MS,
  '1y': 365 * DAY_MS,
};

function computeRangePresetsAvailable(): {
  metricsEpochStartMs: number;
  rangePresetsAvailable: MetricsRangePresetsAvailable;
} {
  const metricsEpochStartMs = getMetricsEpochStartMs();
  const rangePresetsAvailable: MetricsRangePresetsAvailable = {
    '1w': false,
    '1m': false,
    '3m': false,
    '1y': false,
  };
  (['1w', '1m', '3m', '1y'] as const).forEach((preset) => {
    const { start, end } = computeRangeBounds(preset);
    const span = end - start;
    rangePresetsAvailable[preset] = span > 0 && span >= PRESET_MIN_SPAN[preset] * 0.985;
  });
  return { metricsEpochStartMs, rangePresetsAvailable };
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
      signedInUsers = countUsersCumulativeThroughUtcDayEnd(touchMap, d);
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
      signedInUsers = countUsersCumulativeThroughMs(touchMap, wEnd);
    }
    return { label, key: label, sessions, signedInUsers, combined: sessions + signedInUsers };
  });
}

function sumSeriesTail(series: MetricsGrowthSeriesPoint[], n: number, field: 'sessions' | 'signedInUsers' | 'combined'): number {
  const slice = series.slice(-n);
  return slice.reduce((a, p) => a + (p[field] || 0), 0);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function computeWowMom(
  series: MetricsGrowthSeriesPoint[],
  bucket: 'day' | 'week',
  segment: MetricsSegment
): { wow: number | null; mom: number | null; yoy: number | null } {
  const field: 'sessions' | 'signedInUsers' | 'combined' =
    segment === 'sessions' ? 'sessions' : segment === 'signed_in' ? 'signedInUsers' : 'combined';

  // Daily signed-in series is cumulative user count → compare level vs N days ago, not sums of daily DAU.
  if (bucket === 'day' && segment === 'signed_in') {
    const last = series.length - 1;
    if (last < 0) return { wow: null, mom: null, yoy: null };
    const cur = series[last].signedInUsers ?? 0;
    if (last >= 7) {
      const wow = pctChange(cur, series[last - 7].signedInUsers ?? 0);
      const mom = last >= 30 ? pctChange(cur, series[last - 30].signedInUsers ?? 0) : null;
      const yoy = last >= 365 ? pctChange(cur, series[last - 365].signedInUsers ?? 0) : null;
      return { wow, mom, yoy };
    }
    if (last >= 1) {
      const wow = pctChange(cur, series[0].signedInUsers ?? 0);
      return { wow, mom: null, yoy: null };
    }
    return { wow: null, mom: null, yoy: null };
  }

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
  // Fewer than 14 days: compare last day vs first day in range (still shows launch → now movement).
  if (bucket === 'day' && series.length >= 2 && series.length < 14) {
    const first = series[0][field] ?? 0;
    const last = series[series.length - 1][field] ?? 0;
    return { wow: pctChange(last, first), mom: null, yoy: null };
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

/** % of entities active in [cStart,cEnd] who are also active in [nStart,nEnd] (inclusive UTC ranges). */
function rollingBlockPairRate(
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap,
  segment: MetricsSegment,
  cStart: number,
  cEnd: number,
  nStart: number,
  nEnd: number
): number | null {
  const metaById = new Map(metas.map((m) => [m.sessionId, m]));
  const metaSessionsOnly = filterMetas(metas, 'sessions');

  if (segment === 'sessions') {
    const cohort = new Set<string>();
    for (const m of metaSessionsOnly) {
      if (sessionOverlapsUtcRange(m, cStart, cEnd)) cohort.add(m.sessionId);
    }
    if (cohort.size === 0) return null;
    let ret = 0;
    for (const sid of cohort) {
      const m = metaById.get(sid);
      if (m && sessionOverlapsUtcRange(m, nStart, nEnd)) ret += 1;
    }
    return (ret / cohort.size) * 100;
  }

  if (segment === 'signed_in') {
    const cohort = new Set<string>();
    for (const [ek, ut] of touchMap) {
      if (userOverlapsUtcRange(ut, cStart, cEnd)) cohort.add(ek);
    }
    if (cohort.size === 0) return null;
    let ret = 0;
    for (const ek of cohort) {
      const ut = touchMap.get(ek);
      if (ut && userOverlapsUtcRange(ut, nStart, nEnd)) ret += 1;
    }
    return (ret / cohort.size) * 100;
  }

  const cohortS = new Set<string>();
  for (const m of metaSessionsOnly) {
    if (sessionOverlapsUtcRange(m, cStart, cEnd)) cohortS.add(m.sessionId);
  }
  const cohortU = new Set<string>();
  for (const [ek, ut] of touchMap) {
    if (userOverlapsUtcRange(ut, cStart, cEnd)) cohortU.add(ek);
  }
  const cohortN = cohortS.size + cohortU.size;
  if (cohortN === 0) return null;
  let retS = 0;
  for (const sid of cohortS) {
    const m = metaById.get(sid);
    if (m && sessionOverlapsUtcRange(m, nStart, nEnd)) retS += 1;
  }
  let retU = 0;
  for (const ek of cohortU) {
    const ut = touchMap.get(ek);
    if (ut && userOverlapsUtcRange(ut, nStart, nEnd)) retU += 1;
  }
  return ((retS + retU) / cohortN) * 100;
}

function rollingNdayBlockRetention(
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap,
  segment: MetricsSegment,
  anchorEndMs: number,
  n: number
): number | null {
  const bEnd = endOfUtcDay(anchorEndMs);
  const bStart = startOfUtcDay(anchorEndMs) - (n - 1) * DAY_MS;
  const aEnd = bStart - 1;
  const aStart = bStart - n * DAY_MS;
  if (aStart < getMetricsEpochStartMs()) return null;
  return rollingBlockPairRate(metas, touchMap, segment, aStart, aEnd, bStart, bEnd);
}

function clampRetentionRatePct(x: number | null): number | null {
  if (x == null || Number.isNaN(x)) return null;
  return Math.min(100, Math.max(0, x));
}

/**
 * WoW/MoM/YoY for retention = rolling return rates in [0,100] (never relative % change of the chart curve).
 * WoW: prior N days actives → latest N days; same for 30d / 365d. wowDeltaPct = WoW vs same metric anchored 7d earlier.
 */
function computeRollingRetentionKpis(
  metas: AnalyticsSessionMeta[],
  touchMap: UserTouchMap,
  segment: MetricsSegment,
  rangeEnd: number
): { wowPct: number | null; momPct: number | null; yoyPct: number | null; wowDeltaPct: number | null } {
  const wowRaw = rollingNdayBlockRetention(metas, touchMap, segment, rangeEnd, 7);
  const wowPrevRaw = rollingNdayBlockRetention(metas, touchMap, segment, rangeEnd - 7 * DAY_MS, 7);
  const momRaw = rollingNdayBlockRetention(metas, touchMap, segment, rangeEnd, 30);
  const yoyRaw = rollingNdayBlockRetention(metas, touchMap, segment, rangeEnd, 365);
  const wowDeltaRaw = wowRaw != null && wowPrevRaw != null ? wowRaw - wowPrevRaw : null;
  return {
    wowPct: clampRetentionRatePct(wowRaw),
    momPct: clampRetentionRatePct(momRaw),
    yoyPct: clampRetentionRatePct(yoyRaw),
    wowDeltaPct: wowDeltaRaw == null || Number.isNaN(wowDeltaRaw) ? null : wowDeltaRaw,
  };
}

/**
 * Retention: verified S3 accounts only (UserTouchMap — Auth + VavityAggregate LM span).
 * No session IDs. `sessions` on each point is 0; `signedInUsers` / `combined` = retained cohort count.
 */
function buildRetentionSeries(
  touchMap: UserTouchMap,
  rangeStart: number,
  rangeEnd: number,
  bucket: 'day' | 'week'
): MetricsGrowthSeriesPoint[] {
  if (bucket === 'day') {
    const days = eachUtcDay(rangeStart, rangeEnd);
    if (days.length === 0) return [];

    let cohortUsers = new Set<string>();
    let d0Idx = -1;
    for (let i = 0; i < days.length; i += 1) {
      const cu = cohortUsersOnUtcDay(touchMap, days[i]);
      if (cu.size > 0) {
        d0Idx = i;
        cohortUsers = cu;
        break;
      }
    }

    if (d0Idx < 0) {
      return days.map((d) => ({
        label: d,
        key: d,
        sessions: 0,
        signedInUsers: 0,
        combined: 0,
        retentionPct: null,
      }));
    }

    const cohortN = cohortUsers.size;

    return days.map((d, idx) => {
      if (idx < d0Idx) {
        return {
          label: d,
          key: d,
          sessions: 0,
          signedInUsers: 0,
          combined: 0,
          retentionPct: null,
        };
      }
      let userRet = 0;
      for (const ek of cohortUsers) {
        const ut = touchMap.get(ek);
        if (ut && userTouchesUtcDay(ut, d)) userRet += 1;
      }
      const retentionPct = clampRetentionRatePct(cohortN === 0 ? null : (userRet / cohortN) * 100);
      return {
        label: d,
        key: d,
        sessions: 0,
        signedInUsers: userRet,
        combined: userRet,
        retentionPct,
      };
    });
  }

  const weeks = weekBucketsUtcSimple(rangeStart, rangeEnd);
  if (weeks.length === 0) return [];

  let cohortUsers = new Set<string>();
  let w0Idx = -1;
  for (let i = 0; i < weeks.length; i += 1) {
    const cu = cohortUsersOnUtcWeek(touchMap, weeks[i]);
    if (cu.size > 0) {
      w0Idx = i;
      cohortUsers = cu;
      break;
    }
  }

  if (w0Idx < 0) {
    return weeks.map(({ label }) => ({
      label,
      key: label,
      sessions: 0,
      signedInUsers: 0,
      combined: 0,
      retentionPct: null,
    }));
  }

  const cohortN = cohortUsers.size;

  return weeks.map(({ label, wStart, wEnd }, idx) => {
    if (idx < w0Idx) {
      return {
        label,
        key: label,
        sessions: 0,
        signedInUsers: 0,
        combined: 0,
        retentionPct: null,
      };
    }
    let userRet = 0;
    for (const ek of cohortUsers) {
      const ut = touchMap.get(ek);
      const span = ut ? userSpanMs(ut) : null;
      if (span && span.max >= wStart && span.min <= wEnd) userRet += 1;
    }
    const retentionPct = clampRetentionRatePct(cohortN === 0 ? null : (userRet / cohortN) * 100);
    return {
      label,
      key: label,
      sessions: 0,
      signedInUsers: userRet,
      combined: userRet,
      retentionPct,
    };
  });
}

function averageNullableRates(a: number | null, b: number | null): number | null {
  if (a != null && b != null) return (a + b) / 2;
  if (a != null) return a;
  if (b != null) return b;
  return null;
}

export async function buildGrowthPayload(
  s3: AWS.S3,
  bucket: string,
  range: MetricsRange,
  segment: MetricsSegment,
  view: MetricsView
): Promise<MetricsGrowthResponse> {
  const notes: string[] = [
    'Unique (anonymous session) counts use analytics/session-meta when present; otherwise sessions/{id}/VavityAggregate.json (S3 LastModified for range + chart day). Enable NEXT_PUBLIC_ANALYTICS_ENABLED=1 for full session-meta.',
    '“New User Accounts” = every distinct users/…/Auth.json in S3 (one per email; duplicate folder encodings merged). Not filtered by chart date range.',
    'DAUt/WAUt/MAUt (activity panel): same rule per UTC day — S3 Auth/Vavity span, signed-in page-mount, or analytics meta. Windows: today+yesterday / last 7 days / last 30 days.',
    'Retention view uses verified Auth.json only. Anonymous sessions are not part of cohort or retained counts.',
    'Retention uses the same UTC day/week bucket list as growth. Cohort = accounts active on the first bucket in that list that has any activity (leading quiet buckets show null retention). Each later point is % of that cohort still active in that bucket. Verified users with a single S3 timestamp are stretched to range end for retention only. Headline % = last chart point with defined retention.',
    'WoW/MoM/YoY retention KPIs use rolling 7 / 30 / 365 UTC-day windows on account return rates (earlier block → following block). Growth KPIs use week/month/year-over-week on the chart series. Growth session activity uses firstSeen–lastSeen (includes heartbeats).',
  ];

  const [metasAll, touchMapAll, touchMapVerified, registeredSessionKeys, sessionAggregates] =
    await Promise.all([
      loadAllSessionMetasFromS3(s3, bucket),
      listAllUserAuthAccountsFromS3(s3, bucket),
      listVerifiedUserS3Touches(s3, bucket),
      countSessionAggregateKeys(s3, bucket),
      listSessionAggregatesFromS3(s3, bucket),
    ]);

  const touchMap = touchMapAll;
  const registeredUserKeys = touchMapAll.size;
  const registeredCombined = registeredUserKeys + registeredSessionKeys;

  const { start: rangeStart, end: rangeEnd } = computeRangeBounds(range);
  const metasMergedForSessions =
    view === 'retention'
      ? metasAll
      : mergeSessionMetasWithAggregateFallback(metasAll, sessionAggregates, rangeStart, rangeEnd);

  const touchMapForRetention =
    view === 'retention'
      ? widenSingleInstantUserTouchesForRetention(touchMapVerified, rangeStart, rangeEnd)
      : touchMapVerified;

  const aauSessionsAnonymous = countAnonymousBrowsingInRange(metasAll, sessionAggregates, rangeStart, rangeEnd);
  const aauSessionsAny = countAllSessionsInRangeWithS3Orphans(metasAll, sessionAggregates, rangeStart, rangeEnd);
  const aauSignedInSessions = countAauSessionsAnalytic(metasAll, rangeStart, rangeEnd, 'signed_in');
  const aauUsers = countAauUsersS3(touchMap, rangeStart, rangeEnd);
  const aauCombined = aauSessionsAny + aauUsers;
  const spanDays = Math.max(1, (rangeEnd - rangeStart) / DAY_MS);
  const useWeekBuckets = spanDays > 120;
  const bucketType: 'day' | 'week' = useWeekBuckets ? 'week' : 'day';

  let series: MetricsGrowthSeriesPoint[];
  if (view === 'retention') {
    series = buildRetentionSeries(touchMapForRetention, rangeStart, rangeEnd, bucketType);
  } else if (bucketType === 'week') {
    series = buildGrowthSeriesWeekly(metasAll, touchMap, segment, rangeStart, rangeEnd);
    series = applyS3OrphanBrowsingToWeeklySeries(
      series,
      segment,
      metasAll,
      sessionAggregates,
      rangeStart,
      rangeEnd
    );
  } else {
    series = buildGrowthSeriesDaily(metasAll, touchMap, segment, rangeStart, rangeEnd);
    series = applyS3OrphanBrowsingToDailySeries(
      series,
      segment,
      metasAll,
      sessionAggregates,
      rangeStart,
      rangeEnd
    );
  }

  let wow: number | null = null;
  let mom: number | null = null;
  let yoy: number | null = null;
  let wowDeltaPct: number | null = null;

  if (view === 'retention') {
    const r = computeRollingRetentionKpis(metasAll, touchMapForRetention, 'signed_in', rangeEnd);
    wow = r.wowPct;
    mom = r.momPct;
    yoy = r.yoyPct;
    wowDeltaPct = r.wowDeltaPct;
  } else {
    const r = computeWowMom(series, bucketType, segment);
    wow = r.wow;
    mom = r.mom;
    yoy = r.yoy;
  }

  const urForHeadline = userRetentionHalves(touchMapForRetention, rangeStart, rangeEnd);

  let retentionCohortSize = 0;
  let retentionRetained = 0;
  let retentionRatePct: number | null = null;
  if (view === 'retention') {
    retentionCohortSize = urForHeadline.cohort;
    retentionRetained = urForHeadline.retained;
    retentionRatePct = urForHeadline.rate;
  } else {
    const sr = sessionRetentionHalves(
      segment === 'signed_in'
        ? metasMergedForSessions.filter((m) => m.userHash)
        : filterMetas(metasMergedForSessions, 'sessions'),
      rangeStart,
      rangeEnd
    );
    const ur = userRetentionHalves(touchMap, rangeStart, rangeEnd);
    if (segment === 'sessions') {
      retentionCohortSize = sr.cohort;
      retentionRetained = sr.retained;
      retentionRatePct = sr.rate;
    } else if (segment === 'signed_in') {
      retentionCohortSize = ur.cohort;
      retentionRetained = ur.retained;
      retentionRatePct = ur.rate;
    } else {
      retentionCohortSize = Math.round((sr.cohort + ur.cohort) / 2);
      retentionRetained = Math.round((sr.retained + ur.retained) / 2);
      retentionRatePct = clampRetentionRatePct(averageNullableRates(sr.rate, ur.rate));
    }
  }

  if (view === 'retention' && series.length > 0) {
    let firstIdx = -1;
    for (let i = 0; i < series.length; i += 1) {
      if (series[i].retentionPct != null) {
        firstIdx = i;
        break;
      }
    }
    let lastIdx = series.length - 1;
    while (lastIdx >= 0 && series[lastIdx].retentionPct == null) lastIdx -= 1;
    if (firstIdx >= 0 && lastIdx >= firstIdx) {
      const anchor = series[firstIdx];
      const endPt = series[lastIdx];
      retentionCohortSize = anchor.combined;
      retentionRetained = endPt.combined;
      retentionRatePct = endPt.retentionPct ?? null;
    }
  }

  if (view === 'retention') {
    retentionRatePct = clampRetentionRatePct(retentionRatePct);
  }

  const kpis: MetricsGrowthKpis = {
    wowPct: wow,
    wowDeltaPct,
    momPct: mom,
    yoyPct: yoy,
    retentionCohortSize,
    retentionRetained,
    retentionRatePct,
  };

  let growthLabel: MetricsHeadlines['growthLabel'] = null;
  let growthPct: number | null = null;
  if (view === 'retention') {
    if (wow != null) {
      growthLabel = 'WoW';
      growthPct = wow;
    } else if (mom != null) {
      growthLabel = 'MoM';
      growthPct = mom;
    } else if (yoy != null) {
      growthLabel = 'YoY';
      growthPct = yoy;
    } else if (retentionRatePct != null) {
      growthPct = retentionRatePct;
    } else {
      growthPct = 0;
    }
  } else if (wow != null) {
    growthLabel = 'WoW';
    growthPct = wow;
  } else if (mom != null) {
    growthLabel = 'MoM';
    growthPct = mom;
  } else if (yoy != null) {
    growthLabel = 'YoY';
    growthPct = yoy;
  } else {
    growthPct = 0;
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

  const { metricsEpochStartMs, rangePresetsAvailable } = computeRangePresetsAvailable();

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
    metricsEpochStartMs,
    rangePresetsAvailable,
  };
}
