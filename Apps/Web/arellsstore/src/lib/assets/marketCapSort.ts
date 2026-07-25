/** Latest liquid (real) market cap from a VAPA snapshot, or 0 if missing. */
export function latestLiquidMarketCap(
  snapshot?: { liquidMarketCap?: number[] | null } | null
): number {
  const arr = snapshot?.liquidMarketCap;
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const cap = arr[arr.length - 1];
  return typeof cap === 'number' && Number.isFinite(cap) && cap > 0 ? cap : 0;
}

/** Descending market cap; registry index breaks ties / keeps order while caps load. */
export function compareByMarketCapDesc(
  a: { marketCap: number; registryIndex: number },
  b: { marketCap: number; registryIndex: number }
): number {
  if (a.marketCap !== b.marketCap) return b.marketCap - a.marketCap;
  return a.registryIndex - b.registryIndex;
}
