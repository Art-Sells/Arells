export type MetricsRange = 'all' | '1w' | '1m' | '3m' | '1y';
export type MetricsView = 'growth' | 'retention';

export type MetricsGrowthSeriesPoint = {
  label: string;
  /** UTC date or week key */
  key: string;
  /** Cumulative verified accounts through this bucket (growth) or active cohort count (retention) */
  signedInUsers: number;
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
  /** S3 user keys with a discrete Auth/Vavity touch day overlapping the selected range */
  aauUsers: number;
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
