import { buildMarketCatalog } from '../market/buildMarketCatalog';
import { buildFallbackMarketCatalog } from '../market/buildFallbackMarketCatalog';
import type { MarketCatalogSnapshot } from '../market/marketCatalogTypes';
import { loadMarketCatalogFromS3, writeMarketCatalogToS3 } from './loadMarketCatalog';

function catalogHasData(catalog: MarketCatalogSnapshot): boolean {
  return catalog.crypto.length > 0 || catalog.stocks.length > 0;
}

let buildInFlight: Promise<MarketCatalogSnapshot> | null = null;

async function buildAndPersistCatalog(): Promise<MarketCatalogSnapshot> {
  const catalog = await buildMarketCatalog();
  try {
    await writeMarketCatalogToS3(catalog);
  } catch (e) {
    console.error('[market/catalog] putObject after build failed', e);
  }
  return catalog;
}

/**
 * Returns S3 catalog when present; otherwise builds from Nasdaq + CoinGecko (B2), writes S3, returns.
 * Falls back to Arells crypto registry only if the live build fails.
 */
export async function ensureMarketCatalog(): Promise<MarketCatalogSnapshot> {
  const fromS3 = await loadMarketCatalogFromS3();
  if (catalogHasData(fromS3)) return fromS3;

  if (!buildInFlight) {
    buildInFlight = (async () => {
      try {
        return await buildAndPersistCatalog();
      } catch (e) {
        console.error('[market/catalog] auto-build failed', e);
        return buildFallbackMarketCatalog();
      } finally {
        buildInFlight = null;
      }
    })();
  }

  return buildInFlight;
}
