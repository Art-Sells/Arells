import { CRYPTO_ASSETS } from '../assets/cryptoAssetRegistry';
import type { MarketCatalogSnapshot } from './marketCatalogTypes';

/** Arells registry entries so home search works before S3 catalog is seeded. */
export function buildFallbackMarketCatalog(): MarketCatalogSnapshot {
  return {
    generatedAt: 0,
    crypto: CRYPTO_ASSETS.map((asset, index) => ({
      symbol: asset.ticker,
      name: asset.displayName,
      type: 'crypto' as const,
      rank: index + 1,
      marketCapUsd: 0,
      coingeckoId: asset.coingeckoId,
      arellsAvailable: true,
      arellsAssetId: asset.id,
      arellsHref: asset.href,
    })),
    stocks: [],
  };
}

export function resolveMarketCatalog(catalog: MarketCatalogSnapshot): MarketCatalogSnapshot {
  if (catalog.crypto.length > 0 || catalog.stocks.length > 0) return catalog;
  return buildFallbackMarketCatalog();
}
