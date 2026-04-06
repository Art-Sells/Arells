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
  /** sha256+pepper of email when signed in; never raw email */
  userHash: string | null;
  lastPath?: string;
};

export const ANALYTICS_META_PREFIX = 'analytics/session-meta/';
export const HUMAN_DURATION_MS = 5000;

export function sessionMetaKey(sessionId: string): string {
  const safe = encodeURIComponent(sessionId.trim());
  return `${ANALYTICS_META_PREFIX}${safe}.json`;
}
