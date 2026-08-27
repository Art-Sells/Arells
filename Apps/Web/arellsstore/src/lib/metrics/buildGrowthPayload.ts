import type AWS from 'aws-sdk';
import { listVerifiedUserS3Touches, type UserTouchMap } from './listUserS3Touches';
import type {
  MetricsGrowthKpis,
  MetricsGrowthResponse,
  MetricsGrowthSeriesPoint,
  MetricsHeadlines,
  MetricsRange,
  MetricsRangePresetsAvailable,
  MetricsView,
} from './types';

const DAY_MS = 86_400_000;

/** Long windows: classic downward chart, but headline uses first-half → second-half return rate. */
function usesHalfWindowRetentionHeadline(range: MetricsRange): boolean {
  return range === 'all' || range === '3m' || range === '1y';
}

/** UTC midnight of first day included in metrics; rolling windows never start before this. */
function getMetricsEpochStartMs(): number {
  const raw = typeof process !== 'undefined' ? process.env.METRICS_EPOCH_START_UTC?.trim() : '';
  if (raw) {
    const parsed = Date.parse(`${raw}T00:00:00.000Z`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.UTC(2026, 4, 1);
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

function userOverlapsUtcRange(
  ut: { authMs?: number; vavityMs?: number },
  rStart: number,
  rEnd: number
): boolean {
  const span = userSpanMs(ut);
  if (!span) return false;
  return span.max >= rStart && span.min <= rEnd;
}

function userFirstTouchMs(ut: { authMs?: number; vavityMs?: number }): number | null {
  const span = userSpanMs(ut);
  return span ? span.min : null;
}

function countUsersCumulativeThroughUtcDayEnd(touchMap: UserTouchMap, dayKey: string): number {
  const endMs = Date.parse(`${dayKey}T23:59:59.999Z`);
  if (Number.isNaN(endMs)) return 0;
  let n = 0;
  for (const [, ut] of touchMap) {
    const first = userFirstTouchMs(ut);
    if (first != null && first <= endMs) n += 1;
  }
  return n;
}

function countUsersCumulativeThroughMs(touchMap: UserTouchMap, endMsInclusive: number): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    const first = userFirstTouchMs(ut);
    if (first != null && first <= endMsInclusive) n += 1;
  }
  return n;
}

function countAauUsersS3(touchMap: UserTouchMap, rangeStart: number, rangeEnd: number): number {
  let n = 0;
  for (const [, ut] of touchMap) {
    if (userOverlapsUtcRange(ut, rangeStart, rangeEnd)) n += 1;
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

export function computeRangeBounds(range: MetricsRange): { start: number; end: number } {
  const end = Date.now();
  let start: number;
  switch (range) {
    case '1w':
      start = end - 7 * DAY_MS;
      break;
    case '1m':
      start = end - 30 * DAY_MS;
      break;
    case '3m':
      start = end - 90 * DAY_MS;
      break;
    case '1y':
      start = end - 365 * DAY_MS;
      break;
    case 'all':
    default:
      start = getMetricsEpochStartMs();
      break;
  }
  return clampRangeToMetricsEpoch(start, end);
}

function computeRangePresetsAvailable(nowMs: number): MetricsRangePresetsAvailable {
  const epoch = getMetricsEpochStartMs();
  const span = Math.max(0, nowMs - epoch);
  return {
    '1w': span >= 7 * DAY_MS,
    '1m': span >= 30 * DAY_MS,
    '3m': span >= 90 * DAY_MS,
    '1y': span >= 365 * DAY_MS,
  };
}

function clampRetentionRatePct(x: number | null): number | null {
  if (x == null || Number.isNaN(x)) return null;
  return Math.min(100, Math.max(0, x));
}

/**
 * S3 only exposes one or two LastModified timestamps per user; when min === max the user “exists” on a
 * single UTC day and retention falls to 0. For short-window retention only, extend through rangeEnd.
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

function buildGrowthSeriesDaily(
  touchMap: UserTouchMap,
  rangeStart: number,
  rangeEnd: number
): MetricsGrowthSeriesPoint[] {
  return eachUtcDay(rangeStart, rangeEnd).map((d) => {
    const n = countUsersCumulativeThroughUtcDayEnd(touchMap, d);
    return { label: d, key: d, signedInUsers: n };
  });
}

function buildGrowthSeriesWeekly(
  touchMap: UserTouchMap,
  rangeStart: number,
  rangeEnd: number
): MetricsGrowthSeriesPoint[] {
  return weekBucketsUtcSimple(rangeStart, rangeEnd).map((w) => {
    const n = countUsersCumulativeThroughMs(touchMap, Math.min(w.wEnd, rangeEnd));
    return { label: w.label, key: w.label, signedInUsers: n };
  });
}

/**
 * Classic cohort survival: accounts active on first activity day/week,
 * later points = % still span-active (with single-instant widen applied by caller).
 * Leading buckets before the cohort are omitted so the chart starts at ~100% and steps down
 * (avoids a long flat-zero lead-in + needle spike on long windows).
 */
function buildClassicRetentionSeries(
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
        signedInUsers: 0,
        retentionPct: null,
      }));
    }

    const cohortN = cohortUsers.size;
    const fromCohort = days.slice(d0Idx);

    return fromCohort.map((d) => {
      let userRet = 0;
      for (const ek of cohortUsers) {
        const ut = touchMap.get(ek);
        if (ut && userTouchesUtcDay(ut, d)) userRet += 1;
      }
      const retentionPct = clampRetentionRatePct(cohortN === 0 ? null : (userRet / cohortN) * 100);
      return {
        label: d,
        key: d,
        signedInUsers: userRet,
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
    return weeks.map((w) => ({
      label: w.label,
      key: w.label,
      signedInUsers: 0,
      retentionPct: null,
    }));
  }

  const cohortN = cohortUsers.size;
  const fromCohort = weeks.slice(w0Idx);

  return fromCohort.map((w) => {
    let userRet = 0;
    for (const ek of cohortUsers) {
      const ut = touchMap.get(ek);
      const span = ut ? userSpanMs(ut) : null;
      if (span && span.max >= w.wStart && span.min <= w.wEnd) userRet += 1;
    }
    const retentionPct = clampRetentionRatePct(cohortN === 0 ? null : (userRet / cohortN) * 100);
    return {
      label: w.label,
      key: w.label,
      signedInUsers: userRet,
      retentionPct,
    };
  });
}

/** % of accounts overlapping [cStart,cEnd] who also overlap [nStart,nEnd]. */
function rollingBlockPairRate(
  touchMap: UserTouchMap,
  cStart: number,
  cEnd: number,
  nStart: number,
  nEnd: number
): { rate: number | null; cohort: number; retained: number } {
  const cohort = new Set<string>();
  for (const [ek, ut] of touchMap) {
    if (userOverlapsUtcRange(ut, cStart, cEnd)) cohort.add(ek);
  }
  if (cohort.size === 0) return { rate: null, cohort: 0, retained: 0 };
  let retained = 0;
  for (const ek of cohort) {
    const ut = touchMap.get(ek);
    if (ut && userOverlapsUtcRange(ut, nStart, nEnd)) retained += 1;
  }
  return {
    rate: clampRetentionRatePct((retained / cohort.size) * 100),
    cohort: cohort.size,
    retained,
  };
}

/**
 * Rolling N-day return rate ending on anchorEndMs:
 * prior N days → latest N days.
 */
function rollingNdayBlockRetention(
  touchMap: UserTouchMap,
  anchorEndMs: number,
  n: number
): { rate: number | null; cohort: number; retained: number } {
  const bEnd = endOfUtcDay(anchorEndMs);
  const bStart = startOfUtcDay(anchorEndMs) - (n - 1) * DAY_MS;
  const aEnd = bStart - 1;
  const aStart = bStart - n * DAY_MS;
  if (aStart < getMetricsEpochStartMs()) return { rate: null, cohort: 0, retained: 0 };
  return rollingBlockPairRate(touchMap, aStart, aEnd, bStart, bEnd);
}

/** Accounts active in first half of window who are also active in second half (span-fill). */
function userRetentionHalves(
  touchMap: UserTouchMap,
  rangeStart: number,
  rangeEnd: number
): { cohort: number; retained: number; rate: number | null } {
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
  return { cohort: cohort.size, retained, rate: clampRetentionRatePct(rate) };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / prev) * 100;
}

/** True window growth: first non-zero cumulative point → last point. */
function windowGrowthPct(series: MetricsGrowthSeriesPoint[]): number | null {
  if (series.length < 2) return null;
  let firstIdx = -1;
  for (let i = 0; i < series.length; i += 1) {
    if (series[i].signedInUsers > 0) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx < 0) return null;
  if (firstIdx === series.length - 1) return 0;
  return pctChange(series[series.length - 1].signedInUsers, series[firstIdx].signedInUsers);
}

/** Long windows: headline = full-window growth, not WoW. */
function usesWindowGrowthHeadline(range: MetricsRange): boolean {
  return range === 'all' || range === '3m' || range === '1y';
}

function computeWowMom(
  series: MetricsGrowthSeriesPoint[],
  bucket: 'day' | 'week',
  range: MetricsRange
): {
  wow: number | null;
  mom: number | null;
  yoy: number | null;
  growthLabel: MetricsHeadlines['growthLabel'];
  growthPct: number | null;
} {
  if (series.length < 2) {
    return { wow: null, mom: null, yoy: null, growthLabel: null, growthPct: null };
  }
  const last = series[series.length - 1].signedInUsers;
  const wowLookback = bucket === 'week' ? 1 : 7;
  const momLookback = bucket === 'week' ? 4 : 30;
  const yoyLookback = bucket === 'week' ? 52 : 365;

  const at = (back: number) => {
    const i = series.length - 1 - back;
    return i >= 0 ? series[i].signedInUsers : null;
  };

  const wowPrev = at(wowLookback);
  const momPrev = at(momLookback);
  const yoyPrev = at(yoyLookback);

  const wow = wowPrev != null ? pctChange(last, wowPrev) : null;
  const mom = momPrev != null ? pctChange(last, momPrev) : null;
  const yoy = yoyPrev != null ? pctChange(last, yoyPrev) : null;

  let growthLabel: MetricsHeadlines['growthLabel'] = null;
  let growthPct: number | null = null;

  if (usesWindowGrowthHeadline(range)) {
    // Headline = growth across the selected window; WoW/MoM stay on the KPI cards.
    growthLabel = null;
    growthPct = windowGrowthPct(series);
  } else if (wow != null) {
    growthLabel = 'WoW';
    growthPct = wow;
  } else if (mom != null) {
    growthLabel = 'MoM';
    growthPct = mom;
  } else if (yoy != null) {
    growthLabel = 'YoY';
    growthPct = yoy;
  }

  return { wow, mom, yoy, growthLabel, growthPct };
}

function computeRollingRetentionKpis(
  touchMap: UserTouchMap,
  rangeEnd: number
): { wowPct: number | null; momPct: number | null; yoyPct: number | null; wowDeltaPct: number | null } {
  const wowRaw = rollingNdayBlockRetention(touchMap, rangeEnd, 7).rate;
  const wowPrevRaw = rollingNdayBlockRetention(touchMap, rangeEnd - 7 * DAY_MS, 7).rate;
  const momRaw = rollingNdayBlockRetention(touchMap, rangeEnd, 30).rate;
  const yoyRaw = rollingNdayBlockRetention(touchMap, rangeEnd, 365).rate;
  const wowDeltaRaw = wowRaw != null && wowPrevRaw != null ? wowRaw - wowPrevRaw : null;
  return {
    wowPct: clampRetentionRatePct(wowRaw),
    momPct: clampRetentionRatePct(momRaw),
    yoyPct: clampRetentionRatePct(yoyRaw),
    wowDeltaPct: wowDeltaRaw == null || Number.isNaN(wowDeltaRaw) ? null : wowDeltaRaw,
  };
}

export async function buildGrowthPayload(
  s3: AWS.S3,
  bucket: string,
  range: MetricsRange,
  view: MetricsView
): Promise<MetricsGrowthResponse> {
  const halfHeadline = usesHalfWindowRetentionHeadline(range);
  const notes: string[] = [
    'Growth and retention use verified users/…/Auth.json only (accounts). Anonymous sessions are not counted.',
    'Growth series = cumulative registered accounts through each day/week (first Auth or Vavity LastModified).',
    usesWindowGrowthHeadline(range)
      ? 'Growth headline (All / 3M / 1Y): % change from first non-zero cumulative point in the window to the latest point. WoW/MoM cards remain short-lookback deltas.'
      : 'Growth headline (1W / 1M): prefers WoW, then MoM, then YoY on the cumulative series.',
    halfHeadline
      ? 'Retention chart (All / 3M / 1Y): classic cohort survival over the full selected range (weekly buckets when span > 120 days). Headline = first-half → second-half return over the full selected range.'
      : 'Retention chart (1W / 1M): classic cohort survival — accounts active on the first activity day in the window; later points = % still span-active. Single-timestamp accounts are stretched to range end. Headline = last chart point.',
    'WoW/MoM retention KPIs use rolling 7 / 30 day return rates on account spans (absolute rates, not signed deltas).',
    'DAUt/WAUt/MAUt (activity panel): verified accounts via S3 Auth/Vavity touch days and/or signed-in page-mounts.',
  ];

  const touchMap = await listVerifiedUserS3Touches(s3, bucket);
  const registeredUserKeys = touchMap.size;

  const { start: rangeStart, end: rangeEnd } = computeRangeBounds(range);
  const aauUsers = countAauUsersS3(touchMap, rangeStart, rangeEnd);

  const chartSpanDays = Math.max(1, (rangeEnd - rangeStart) / DAY_MS);
  const useWeekBuckets = chartSpanDays > 120;
  const bucketType: 'day' | 'week' = useWeekBuckets ? 'week' : 'day';

  const touchMapForClassicRetention =
    view === 'retention'
      ? widenSingleInstantUserTouchesForRetention(touchMap, rangeStart, rangeEnd)
      : touchMap;

  let series: MetricsGrowthSeriesPoint[];
  if (view === 'retention') {
    series = buildClassicRetentionSeries(
      touchMapForClassicRetention,
      rangeStart,
      rangeEnd,
      bucketType
    );
  } else if (bucketType === 'week') {
    series = buildGrowthSeriesWeekly(touchMap, rangeStart, rangeEnd);
  } else {
    series = buildGrowthSeriesDaily(touchMap, rangeStart, rangeEnd);
  }

  let wow: number | null = null;
  let mom: number | null = null;
  let yoy: number | null = null;
  let wowDeltaPct: number | null = null;
  let growthLabel: MetricsHeadlines['growthLabel'] = null;
  let growthPct: number | null = null;

  if (view === 'retention') {
    const r = computeRollingRetentionKpis(touchMap, rangeEnd);
    wow = r.wowPct;
    mom = r.momPct;
    yoy = r.yoyPct;
    wowDeltaPct = r.wowDeltaPct;
  } else {
    const r = computeWowMom(series, bucketType, range);
    wow = r.wow;
    mom = r.mom;
    yoy = r.yoy;
    growthLabel = r.growthLabel;
    growthPct = r.growthPct;
  }

  let retentionCohortSize = 0;
  let retentionRetained = 0;
  let retentionRatePct: number | null = null;
  if (view === 'retention') {
    if (halfHeadline) {
      const halves = userRetentionHalves(touchMapForClassicRetention, rangeStart, rangeEnd);
      retentionCohortSize = halves.cohort;
      retentionRetained = halves.retained;
      retentionRatePct = halves.rate;
    } else {
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
        retentionCohortSize = series[firstIdx].signedInUsers;
        retentionRetained = series[lastIdx].signedInUsers;
        retentionRatePct = series[lastIdx].retentionPct ?? null;
      }
    }
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

  const headlines: MetricsHeadlines = {
    registeredUserKeys,
    aauUsers,
    growthLabel,
    growthPct,
  };

  return {
    generatedAt: Date.now(),
    range,
    view,
    rangeStart,
    rangeEnd,
    bucket: bucketType,
    series,
    kpis,
    headlines,
    notes,
    metricsEpochStartMs: getMetricsEpochStartMs(),
    rangePresetsAvailable: computeRangePresetsAvailable(rangeEnd),
  };
}
