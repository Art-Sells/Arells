export type AnalyticsBeaconType = 'open' | 'heartbeat' | 'pageview';

export type AnalyticsSessionMeta = {
  sessionId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  lastIp: string;
  userAgent: string;
  heartbeatCount: number;
  pageviewCount: number;
  /** Recent paths, newest last, capped */
  paths: string[];
  /** UTC YYYY-MM-DD for days with at least one `open` or `pageview` (not heartbeat-only); retention uses this when present */
  pageMountDayKeys?: string[];
  /** Per normalized path: UTC YYYY-MM-DD days with `open` or `pageview` on that path (for DAU/WAU/MAU on a target page). */
  pathMountDayKeys?: Record<string, string[]>;
  /** sha256+pepper of email when signed in; never raw email */
  userHash: string | null;
  lastPath?: string;
};

export const ANALYTICS_META_PREFIX = 'analytics/session-meta/';
/** Precomputed dashboard payload (single-object read for /api/analytics/summary). */
export const ANALYTICS_METRICS_AGGREGATE_KEY = 'analytics/metrics-aggregate.json';
export const HUMAN_DURATION_MS = 5000;

export type AnalyticsMetricsSummaryJson = {
  generatedAt: number;
  humanThresholdMs: number;
  totalSessions: number;
  uniqueIps: number;
  signedInSessions: number;
  humanLikelyCount: number;
  botLikelyCount: number;
  avgDurationMs: number;
  byFirstSeenDay: Record<string, number>;
  recentSessions: Array<{
    sessionId: string;
    firstSeenAt: number;
    lastSeenAt: number;
    durationMs: number;
    humanLikely: boolean;
    lastIp: string;
    userAgent: string;
    signedIn: boolean;
    heartbeats: number;
    pageviews: number;
    lastPath?: string;
  }>;
};

export function sessionMetaKey(sessionId: string): string {
  const safe = encodeURIComponent(sessionId.trim());
  return `${ANALYTICS_META_PREFIX}${safe}.json`;
}
