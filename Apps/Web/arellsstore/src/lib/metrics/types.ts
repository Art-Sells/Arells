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
  /** Retention + weekly bucket: prior-week → last-week rolling rate minus the week before that (pp); drives trend arrow */
  wowDeltaPct: number | null;
  momPct: number | null;
  yoyPct: number | null;
  retentionCohortSize: number;
  retentionRetained: number;
  retentionRatePct: number | null;
};

/** Totals for hero row (registered keys + active-in-range). */
export type MetricsHeadlines = {
  /** Distinct verified users/…/Auth.json in S3 (not chart-range filtered) */
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

/** Whether each fixed window has enough history (vs metrics epoch) to be meaningful. `all` is always available. */
export type MetricsRangePresetsAvailable = {
  '1w': boolean;
  '1m': boolean;
  '3m': boolean;
  '1y': boolean;
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
  /** UTC ms start of metrics window (same as server clamp); for client range UI. */
  metricsEpochStartMs: number;
  /** Preset ranges with span ≥ intended window after epoch clamp (else false). */
  rangePresetsAvailable: MetricsRangePresetsAvailable;
};
