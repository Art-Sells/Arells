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

/**
 * Sort asset ids by latest liquid market cap (desc).
 * `registryOrder` supplies stable tiebreaks while snapshots are still loading (cap 0).
 */
export function sortAssetIdsByMarketCapDesc(
  ids: readonly string[],
  getSnapshot: (id: string) => { liquidMarketCap?: number[] | null } | null | undefined,
  registryOrder: readonly string[]
): string[] {
  const indexById = new Map(registryOrder.map((id, index) => [id, index]));
  return [...ids]
    .map((id) => ({
      id,
      marketCap: latestLiquidMarketCap(getSnapshot(id)),
      registryIndex: indexById.get(id) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(compareByMarketCapDesc)
    .map((row) => row.id);
}
