import type { MarketCatalogEntry, MarketCatalogSnapshot } from './marketCatalogTypes';

const MAX_SEARCH_RESULTS = 10;

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function entryHaystack(entry: MarketCatalogEntry): string {
  return `${entry.symbol} ${entry.name}`.toLowerCase();
}

function scoreEntry(entry: MarketCatalogEntry, query: string): number {
  const symbol = entry.symbol.toLowerCase();
  const name = entry.name.toLowerCase();
  const haystack = entryHaystack(entry);
  const nameWords = name.split(/\s+/).filter(Boolean);

  if (symbol === query) return 1000;
  if (name === query) return 990;
  if (symbol.startsWith(query)) return 900 - symbol.length;

  if (nameWords[0] === query) {
    if (nameWords.length === 1) return 880 - name.length;
    return 520 - name.length;
  }

  if (name.startsWith(query)) return 800 - name.length;

  const symbolIdx = symbol.indexOf(query);
  if (symbolIdx >= 0) return 700 - symbolIdx;

  const nameWordPrefix = nameWords.some((word) => word.startsWith(query));
  if (nameWordPrefix) return 600;

  const nameIdx = name.indexOf(query);
  if (nameIdx >= 0) return 500 - nameIdx;

  const hayIdx = haystack.indexOf(query);
  if (hayIdx >= 0) return 400 - hayIdx;

  return -1;
}

export function searchMarketCatalog(
  catalog: MarketCatalogSnapshot | null,
  rawQuery: string,
  maxResults = MAX_SEARCH_RESULTS
): MarketCatalogEntry[] {
  const query = normalizeQuery(rawQuery);
  if (!catalog || query.length === 0) return [];

  const all = [...catalog.crypto, ...catalog.stocks];
  const scored: { entry: MarketCatalogEntry; score: number }[] = [];

  for (const entry of all) {
    const score = scoreEntry(entry, query);
    if (score >= 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.entry.type !== b.entry.type) return a.entry.type === 'crypto' ? -1 : 1;
    return a.entry.rank - b.entry.rank;
  });

  const seen = new Set<string>();
  const results: MarketCatalogEntry[] = [];
  for (const { entry } of scored) {
    const key = `${entry.type}:${entry.symbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(entry);
    if (results.length >= maxResults) break;
  }

  return results;
}
