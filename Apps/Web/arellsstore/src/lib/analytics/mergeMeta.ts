import type { AnalyticsBeaconType, AnalyticsSessionMeta } from './types';
import { normalizeAnalyticsPath } from './pathUtils';

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
  let pageMountDayKeys = [...(prev?.pageMountDayKeys ?? [])];
  let pathMountDayKeys: Record<string, string[]> | undefined =
    prev?.pathMountDayKeys && Object.keys(prev.pathMountDayKeys).length
      ? { ...prev.pathMountDayKeys }
      : undefined;

  if (type === 'open' || type === 'pageview') {
    const dayKey = new Date(now).toISOString().slice(0, 10);
    if (!pageMountDayKeys.includes(dayKey)) {
      pageMountDayKeys.push(dayKey);
      if (pageMountDayKeys.length > 400) pageMountDayKeys = pageMountDayKeys.slice(-400);
    }
    const norm = normalizeAnalyticsPath(path);
    if (norm) {
      const next = pathMountDayKeys ? { ...pathMountDayKeys } : {};
      const arr = [...(next[norm] ?? [])];
      if (!arr.includes(dayKey)) {
        arr.push(dayKey);
        if (arr.length > 400) arr.splice(0, arr.length - 400);
        next[norm] = arr;
      }
      pathMountDayKeys = Object.keys(next).length ? next : undefined;
    }
  }
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
    pageMountDayKeys: pageMountDayKeys.length ? pageMountDayKeys : undefined,
    pathMountDayKeys,
    userHash: userHash ?? prev?.userHash ?? null,
    lastPath: path ?? prev?.lastPath,
  };
}
