export type MetricsRange = 'all' | '1w' | '1m' | '3m' | '1y';
export type MetricsSegment = 'all' | 'signed_in' | 'sessions';
export type MetricsView = 'growth' | 'retention';

export type MetricsGrowthSeriesPoint = {
  label: string;
  /** UTC date or week key */
  key: string;
  sessions: number;
  signedInUsers: number;
  /** sessions + signedInUsers (may double-count; labeled in UI when segment=all) */
  combined: number;
  /** Retention view: % of initial cohort still active this bucket */
  retentionPct?: number | null;
};

export type MetricsGrowthKpis = {
  wowPct: number | null;
  momPct: number | null;
  yoyPct: number | null;
  strictSessionDau: number;
  strictSessionWau: number;
  strictSessionMau: number;
  strictUserDau: number;
  strictUserWau: number;
  strictUserMau: number;
  retentionCohortSize: number;
  retentionRetained: number;
  retentionRatePct: number | null;
};

/** Totals for hero row (registered keys + active-in-range). */
export type MetricsHeadlines = {
  registeredUserKeys: number;
  registeredSessionKeys: number;
  /** users + sessions (may double-count people) */
  registeredCombined: number;
  /** S3 user keys with activity span overlapping the selected range */
  aauUsers: number;
  /** Analytics sessions without userHash overlapping range */
  aauSessionsAnonymous: number;
  /** Analytics sessions with userHash overlapping range */
  aauSignedInSessions: number;
  /** aauSessionsAny + aauUsers (may double-count) */
  aauCombined: number;
  growthLabel: 'WoW' | 'MoM' | 'YoY' | null;
  growthPct: number | null;
};

export type MetricsGrowthResponse = {
  generatedAt: number;
  range: MetricsRange;
  segment: MetricsSegment;
  view: MetricsView;
  rangeStart: number;
  rangeEnd: number;
  bucket: 'day' | 'week';
  series: MetricsGrowthSeriesPoint[];
  kpis: MetricsGrowthKpis;
  headlines: MetricsHeadlines;
  /** Human-readable caveats */
  notes: string[];
};
