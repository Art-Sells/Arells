import { CRYPTO_ASSETS } from '../assets/cryptoAssetRegistry';
import { STOCK_ASSETS } from '../assets/stockAssetRegistry';

export type HomeSearchEntry = {
  symbol: string;
  name: string;
  assetId: string;
  href: string;
  kind: 'crypto' | 'stock';
};

const MAX_SEARCH_RESULTS = 10;

const HOME_SEARCH_ENTRIES: HomeSearchEntry[] = [
  ...CRYPTO_ASSETS.map((asset) => ({
    symbol: asset.ticker,
    name: asset.displayName,
    assetId: asset.id,
    href: asset.href,
    kind: 'crypto' as const,
  })),
  ...STOCK_ASSETS.map((asset) => ({
    symbol: asset.ticker,
    name: asset.displayName,
    assetId: asset.id,
    href: asset.href,
    kind: 'stock' as const,
  })),
];

export function getHomeSearchEntries(): readonly HomeSearchEntry[] {
  return HOME_SEARCH_ENTRIES;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function scoreEntry(entry: HomeSearchEntry, query: string): number {
  const symbol = entry.symbol.toLowerCase();
  const name = entry.name.toLowerCase();

  if (symbol === query) return 1000;
  if (name === query) return 990;
  if (symbol.startsWith(query)) return 900 - symbol.length;
  if (name.startsWith(query)) return 800 - name.length;

  return -1;
}

export function searchHomeAssets(
  rawQuery: string,
  maxResults = MAX_SEARCH_RESULTS
): HomeSearchEntry[] {
  const query = normalizeQuery(rawQuery);
  if (query.length === 0) return [];

  const scored: { entry: HomeSearchEntry; score: number }[] = [];

  for (const entry of HOME_SEARCH_ENTRIES) {
    const score = scoreEntry(entry, query);
    if (score >= 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.symbol.localeCompare(b.entry.symbol);
  });

  return scored.slice(0, maxResults).map(({ entry }) => entry);
}
