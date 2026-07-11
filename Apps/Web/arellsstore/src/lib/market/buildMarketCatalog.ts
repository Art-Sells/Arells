import { getArellsCryptoAvailability } from '../assets/cryptoAssetRegistry';
import { fetchCoinGeckoCryptoUniverse } from './fetchCoinGeckoCryptoUniverse';
import { fetchNasdaqStockUniverse } from './fetchNasdaqStockUniverse';
import type { MarketCatalogEntry, MarketCatalogSnapshot } from './marketCatalogTypes';
import {
  MARKET_CATALOG_CRYPTO_LIMIT,
  MARKET_CATALOG_STOCK_LIMIT,
} from './marketCatalogTypes';

export async function buildMarketCatalog(): Promise<MarketCatalogSnapshot> {
  const [cryptoRows, stockRows] = await Promise.all([
    fetchCoinGeckoCryptoUniverse(MARKET_CATALOG_CRYPTO_LIMIT),
    fetchNasdaqStockUniverse(MARKET_CATALOG_STOCK_LIMIT),
  ]);

  const crypto: MarketCatalogEntry[] = cryptoRows.map((row, index) => {
    const availability = getArellsCryptoAvailability(row.id, row.symbol);
    return {
      symbol: row.symbol,
      name: row.name,
      type: 'crypto',
      rank: index + 1,
      marketCapUsd: row.marketCapUsd,
      coingeckoId: row.id,
      arellsAvailable: availability.available,
      ...(availability.assetId ? { arellsAssetId: availability.assetId } : {}),
      ...(availability.href ? { arellsHref: availability.href } : {}),
    };
  });

  const stocks: MarketCatalogEntry[] = stockRows.map((row, index) => ({
    symbol: row.symbol,
    name: row.name,
    type: 'stock',
    rank: index + 1,
    marketCapUsd: row.marketCapUsd,
    arellsAvailable: false,
  }));

  return {
    generatedAt: Date.now(),
    crypto,
    stocks,
  };
}
