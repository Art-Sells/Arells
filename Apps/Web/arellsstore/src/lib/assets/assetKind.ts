import { CRYPTO_ASSET_BY_ID, getCryptoAssetMeta } from './cryptoAssetRegistry';
import { getStockAssetMeta, isStockAssetId, STOCK_ASSET_BY_ID } from './stockAssetRegistry';

export type AssetKind = 'crypto' | 'stocks';

export function getAssetKind(assetId: string): AssetKind {
  return isStockAssetId(assetId) ? 'stocks' : 'crypto';
}

export function getAssetApiBasePath(assetId: string): string {
  const kind = getAssetKind(assetId);
  return `/api/assets/${kind}/${assetId}`;
}

export function getAssetVapaUrl(assetId: string): string {
  return `${getAssetApiBasePath(assetId)}/${assetId}vapa`;
}

export function getAssetHistoricalPriceUrl(assetId: string): string {
  return `${getAssetApiBasePath(assetId)}/${assetId}VapaHistoricalPrice`;
}

export function getAssetMockPortfolioUrl(assetId: string): string {
  return `${getAssetApiBasePath(assetId)}/${assetId}MockPortfolio`;
}

export function getAnyAssetMeta(id: string): { href: string; label: string } | null {
  return getCryptoAssetMeta(id) ?? getStockAssetMeta(id);
}

export function isKnownAssetId(id: string): boolean {
  return id in CRYPTO_ASSET_BY_ID || id in STOCK_ASSET_BY_ID;
}
