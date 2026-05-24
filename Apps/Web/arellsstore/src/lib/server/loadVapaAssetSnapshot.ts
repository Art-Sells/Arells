import { CRYPTO_VAPA_KEYS } from '../assets/cryptoAssetRegistry';
import {
  applyRecalculatedFields,
  historyDayKey,
  type PriceHistoryPoint,
  type VapaAssetSnapshot,
} from '../vavity/portfolioValuation';

function sanitizeHistoryPoints(raw: unknown): PriceHistoryPoint[] {
  if (!Array.isArray(raw)) return [];
  const out: PriceHistoryPoint[] = [];
  for (const entry of raw) {
    const price = Number((entry as { price?: unknown })?.price);
    const dateRaw = (entry as { date?: unknown })?.date;
    if (typeof dateRaw !== 'string' || !Number.isFinite(price) || price <= 0) continue;
    const day = historyDayKey(dateRaw);
    if (!day) continue;
    out.push({ date: day, price });
  }
  return out;
}
import { loadCurrentAssetSpotPrice } from './assetSpotPrice';
import { getServerS3 } from './awsS3';
import { s3BucketNameOrThrow } from './s3Bucket';

const s3 = getServerS3();

export async function loadVapaAssetSnapshot(asset: string): Promise<VapaAssetSnapshot> {
  const key = CRYPTO_VAPA_KEYS[asset] || CRYPTO_VAPA_KEYS.bitcoin;
  try {
    const response = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
    const data = response.Body ? JSON.parse(response.Body.toString()) : {};
    const solidRaw = Array.isArray(data.solidHistory)
      ? data.solidHistory
      : Array.isArray(data.history)
        ? data.history
        : [];
    const liquidRaw = Array.isArray(data.liquidHistory)
      ? data.liquidHistory
      : Array.isArray(data.realHistory)
        ? data.realHistory
        : [];
    return {
      vapa: typeof data.vapa === 'number' ? data.vapa : 0,
      price: typeof data.price === 'number' ? data.price : null,
      solidHistory: sanitizeHistoryPoints(solidRaw),
      liquidHistory: sanitizeHistoryPoints(liquidRaw),
    };
  } catch {
    return { vapa: 0, price: null, solidHistory: [], liquidHistory: [] };
  }
}

export async function recalculateInvestmentsForAllAssets(
  investments: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const assetIds = Array.from(
    new Set(investments.map((inv) => String(inv?.asset || 'bitcoin').toLowerCase()))
  );
  const snapshotCache = new Map<string, VapaAssetSnapshot>();
  const liquidPriceCache = new Map<string, number | null>();
  await Promise.all(
    assetIds.map(async (assetId) => {
      const [snapshot, spot] = await Promise.all([
        loadVapaAssetSnapshot(assetId),
        loadCurrentAssetSpotPrice(assetId),
      ]);
      snapshotCache.set(assetId, snapshot);
      liquidPriceCache.set(assetId, spot);
    })
  );
  return investments.map((inv) => {
    const assetId = String(inv?.asset || 'bitcoin').toLowerCase();
    const snapshot = snapshotCache.get(assetId) ?? {
      vapa: 0,
      price: null,
      solidHistory: [],
      liquidHistory: [],
    };
    const currentLiquid = liquidPriceCache.get(assetId) ?? snapshot.price;
    return applyRecalculatedFields(inv, snapshot, assetId, currentLiquid);
  });
}
