export const MARKET_CATALOG_S3_KEY = 'market/home-search-catalog.json';

export const MARKET_CATALOG_CRYPTO_LIMIT = 500;
export const MARKET_CATALOG_STOCK_LIMIT = 500;
export const MARKET_CATALOG_TOP_STOCKS_HOME = 6;

export type MarketCatalogEntry = {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  rank: number;
  marketCapUsd: number;
  coingeckoId?: string;
  arellsAvailable: boolean;
  arellsAssetId?: string;
  arellsHref?: string;
};

export type MarketCatalogSnapshot = {
  generatedAt: number;
  crypto: MarketCatalogEntry[];
  stocks: MarketCatalogEntry[];
};

export function emptyMarketCatalog(): MarketCatalogSnapshot {
  return { generatedAt: 0, crypto: [], stocks: [] };
}

export function isMarketCatalogSnapshot(value: unknown): value is MarketCatalogSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as MarketCatalogSnapshot;
  return (
    typeof v.generatedAt === 'number' &&
    Array.isArray(v.crypto) &&
    Array.isArray(v.stocks)
  );
}

export function getTopStocks(catalog: MarketCatalogSnapshot, limit = MARKET_CATALOG_TOP_STOCKS_HOME): MarketCatalogEntry[] {
  return catalog.stocks.slice(0, limit);
}
