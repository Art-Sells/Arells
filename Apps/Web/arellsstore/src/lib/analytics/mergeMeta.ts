import type { AnalyticsBeaconType, AnalyticsSessionMeta } from './types';

const MAX_PATHS = 30;

export function mergeSessionMeta(
  prev: AnalyticsSessionMeta | null,
  sessionId: string,
  now: number,
  ip: string,
  userAgent: string,
  type: AnalyticsBeaconType,
  path: string | undefined,
  userHash: string | null
): AnalyticsSessionMeta {
  const first = prev?.firstSeenAt ?? now;
  let heartbeatCount = prev?.heartbeatCount ?? 0;
  let pageviewCount = prev?.pageviewCount ?? 0;
  if (type === 'heartbeat') heartbeatCount += 1;
  if (type === 'pageview') pageviewCount += 1;

  const paths = [...(prev?.paths ?? [])];
  if (type === 'pageview' && path) {
    if (paths[paths.length - 1] !== path) {
      paths.push(path);
      while (paths.length > MAX_PATHS) paths.shift();
    }
  }
  if (type === 'open' && path) {
    if (paths.length === 0 || paths[paths.length - 1] !== path) {
      paths.push(path);
      while (paths.length > MAX_PATHS) paths.shift();
    }
  }

  return {
    sessionId,
    firstSeenAt: first,
    lastSeenAt: now,
    lastIp: ip,
    userAgent: userAgent.slice(0, 512),
    heartbeatCount,
    pageviewCount,
    paths,
    userHash: userHash ?? prev?.userHash ?? null,
    lastPath: path ?? prev?.lastPath,
  };
}
