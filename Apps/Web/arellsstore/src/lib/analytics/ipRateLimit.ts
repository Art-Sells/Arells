/**
 * Simple per-IP sliding window for analytics ingest (best-effort; resets per server instance).
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

const buckets = new Map<string, number[]>();

export function allowAnalyticsIp(ip: string): boolean {
  const now = Date.now();
  const arr = buckets.get(ip) ?? [];
  const pruned = arr.filter((t) => now - t < WINDOW_MS);
  if (pruned.length >= MAX_PER_WINDOW) {
    buckets.set(ip, pruned);
    return false;
  }
  pruned.push(now);
  buckets.set(ip, pruned);
  if (buckets.size > 50_000) {
    buckets.clear();
  }
  return true;
}
