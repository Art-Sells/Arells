import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3({
  region: process.env.WS_REGION,
  accessKeyId: process.env.WS_ACCESS_KEY_ID,
  secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const SESSION_TTL_MS = (() => {
  const raw = process.env.VAPAGG_SESSION_TTL_MS;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  // Default to 1 minute unless explicitly overridden.
  return 60_000;
})();
const VAPA_KEYS: Record<string, string> = {
  bitcoin: 'vavity/bitcoinVAPA.json',
  ethereum: 'vavity/ethereumVAPA.json',
};

const normalizeToIsoDay = (value: string): string | null => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const getNearestHistoricalPrice = (
  history: { date: string; price: number }[],
  targetDate: string
): { date: string; price: number } | null => {
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let selected: { date: string; price: number } | null = null;
  for (const entry of sorted) {
    if (entry.date <= targetDate) selected = entry;
    else break;
  }
  return selected;
};

const loadVapaData = async (asset: string): Promise<{
  vapa: number;
  price: number | null;
  solidHistory: { date: string; price: number }[];
  liquidHistory: { date: string; price: number }[];
}> => {
  const key = VAPA_KEYS[asset] || VAPA_KEYS.bitcoin;
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const data = response.Body ? JSON.parse(response.Body.toString()) : {};
    return {
      vapa: typeof data.vapa === 'number' ? data.vapa : 0,
      price: typeof data.price === 'number' ? data.price : null,
      solidHistory: Array.isArray(data.solidHistory)
        ? data.solidHistory
        : Array.isArray(data.history)
          ? data.history
          : [],
      liquidHistory: Array.isArray(data.liquidHistory)
        ? data.liquidHistory
        : Array.isArray(data.realHistory)
          ? data.realHistory
          : [],
    };
  } catch {
    return { vapa: 0, price: null, solidHistory: [], liquidHistory: [] };
  }
};

const loadCurrentPrice = async (asset: string): Promise<number | null> => {
  const url =
    asset === 'ethereum'
      ? '/api/assets/crypto/ethereum/ethereumPrice'
      : '/api/assets/crypto/bitcoin/bitcoinPrice';
  try {
    const response = await axios
      .get(`http://localhost:3000${url}`, { timeout: 5000 })
      .catch(() => axios.get(url, { timeout: 5000 }));
    const payload = response.data || {};
    const priceObj = asset === 'ethereum' ? payload.ethereum : payload.bitcoin;
    const price = priceObj?.usd;
    return typeof price === 'number' ? price : null;
  } catch {
    return null;
  }
};

const calculateTotals = (investments: any[]) => {
  return investments.reduce(
    (acc, inv) => {
      const cVatop = Number(inv.cVatop) || 0;
      const cVact = Number(inv.cVact) || 0;
      const cdVatop = Number(inv.cdVatop) || 0;
      const cVactTaa = Number(inv.cVactTaa) || 0;
      acc.acVatop += cVatop;
      acc.acVact += cVact;
      acc.acdVatop += cdVatop;
      acc.acVactTaa += cVactTaa;
      return acc;
    },
    { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
  );
};

const calculateTotalsLiquid = (investments: any[]) => {
  return investments.reduce(
    (acc, inv) => {
      const cVatop = Number(inv.lCVatop ?? inv.rCVatop) || 0;
      const cVact = Number(inv.lCVact ?? inv.rCVact) || 0;
      const cdVatop = Number(inv.lCdVatop ?? inv.rCdVatop) || 0;
      const cVactTaa = Number(inv.cVactTaa) || 0;
      acc.acVatop += cVatop;
      acc.acVact += cVact;
      acc.acdVatop += cdVatop;
      acc.acVactTaa += cVactTaa;
      return acc;
    },
    { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
  );
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawSessionId = req.query.sessionId;
  const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
  const rawAsset = req.query.asset;
  const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
  const normalizedAsset = typeof asset === 'string' && asset.length ? asset.toLowerCase() : undefined;
  const rawSkipExpiry = req.query.skipExpiry;
  const skipExpiryParam = Array.isArray(rawSkipExpiry) ? rawSkipExpiry[0] : rawSkipExpiry;
  const skipExpiry =
    typeof skipExpiryParam === 'string'
      ? ['1', 'true', 'yes', 'on'].includes(skipExpiryParam.toLowerCase())
      : Boolean(skipExpiryParam);

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }

  const key = `sessions/${sessionId}/VavityAggregate.json`;

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const userData = JSON.parse(data.Body!.toString());

    // Session TTL meta: if expired, delete the session object and return empty.
    const now = Date.now();
    const existingCreatedAt = typeof userData?.createdAt === 'number' ? userData.createdAt : null;
    const existingExpiresAt = typeof userData?.expiresAt === 'number' ? userData.expiresAt : null;
    const expired = typeof existingExpiresAt === 'number' && Number.isFinite(existingExpiresAt) && now >= existingExpiresAt;
    if (expired && !skipExpiry) {
      try {
        await s3.deleteObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      } catch {
        // ignore delete errors; still return empty
      }
      return res.status(200).json({
        investments: [],
        totals: { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 },
        totalsLiquid: { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 },
      });
    }

    // Backfill TTL meta for legacy session files that predate createdAt/expiresAt.
    // This does NOT create a new session file; it only updates existing ones.
    let didMutate = false;
    const createdAt = existingCreatedAt ?? now;
    let expiresAt = existingExpiresAt ?? createdAt + SESSION_TTL_MS;
    if (typeof expiresAt === 'number' && Number.isFinite(expiresAt)) {
      const maxExpiresAt = now + SESSION_TTL_MS;
      if (expiresAt > maxExpiresAt) {
        expiresAt = maxExpiresAt;
        didMutate = true;
      }
    }
    const investmentsAll: any[] = Array.isArray(userData.investments) ? userData.investments : [];

    // Recompute/update both Solid + Liquid fields so stored JSON stays current as prices move.
    const assetsToUpdate = normalizedAsset ? [normalizedAsset] : Array.from(new Set(investmentsAll.map((i) => (i?.asset || 'bitcoin').toLowerCase())));
    const vapaCache = new Map<string, Awaited<ReturnType<typeof loadVapaData>>>();
    const currentPriceCache = new Map<string, number | null>();

    for (const a of assetsToUpdate) {
      vapaCache.set(a, await loadVapaData(a));
      currentPriceCache.set(a, await loadCurrentPrice(a));
    }

    const hasLegacyLiquidFields = investmentsAll.some(
      (inv) =>
        inv &&
        (typeof inv.rCpVatop === 'number' ||
          typeof inv.rCpVact === 'number' ||
          typeof inv.rCVatop === 'number' ||
          typeof inv.rCVact === 'number' ||
          typeof inv.rCdVatop === 'number')
    );
    const hasLegacyTotals = userData?.totalsReality != null;
    didMutate = didMutate || hasLegacyLiquidFields || hasLegacyTotals;
    if (existingCreatedAt == null || existingExpiresAt == null) {
      didMutate = true;
    }
    const normalizeExistingInvestment = (inv: any) => {
      const next = { ...(inv || {}) };
      if (typeof next.lCpVatop !== 'number' && typeof next.rCpVatop === 'number') next.lCpVatop = next.rCpVatop;
      if (typeof next.lCpVact !== 'number' && typeof next.rCpVact === 'number') next.lCpVact = next.rCpVact;
      if (typeof next.lCVatop !== 'number' && typeof next.rCVatop === 'number') next.lCVatop = next.rCVatop;
      if (typeof next.lCVact !== 'number' && typeof next.rCVact === 'number') next.lCVact = next.rCVact;
      if (typeof next.lCdVatop !== 'number' && typeof next.rCdVatop === 'number') next.lCdVatop = next.rCdVatop;
      delete next.rCpVatop;
      delete next.rCpVact;
      delete next.rCVatop;
      delete next.rCVact;
      delete next.rCdVatop;
      return next;
    };

    const updatedAll = investmentsAll.map((inv) => {
      const migrated = normalizeExistingInvestment(inv);
      const assetId = (inv?.asset || 'bitcoin').toLowerCase();
      if (normalizedAsset && assetId !== normalizedAsset) return inv;
      const vapaData = vapaCache.get(assetId) ?? { vapa: 0, price: null, solidHistory: [], liquidHistory: [] };
      const currentLiquidPrice = (currentPriceCache.get(assetId) ?? null) ?? vapaData.price;

      const rawAmount = inv?.cVactTaa ?? 0;
      const cVactTaa = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
      const normalizedDate = typeof inv?.date === 'string' ? normalizeToIsoDay(inv.date) : null;
      const hasDateAndAmount = Boolean(normalizedDate) && cVactTaa > 0;

      let cpVatop = typeof migrated?.cpVatop === 'number' ? migrated.cpVatop : 0;
      if (hasDateAndAmount) {
        const historical = getNearestHistoricalPrice(vapaData.solidHistory, normalizedDate as string);
        if (historical) cpVatop = historical.price;
        else if (typeof vapaData.vapa === 'number' && vapaData.vapa > 0) cpVatop = vapaData.vapa;
      }
      const cpVact = vapaData.vapa || cpVatop;
      const cVatop = hasDateAndAmount ? cVactTaa * cpVatop : Number(migrated?.cVatop) || 0;
      const cVact = hasDateAndAmount ? cVactTaa * cpVact : Number(migrated?.cVact) || 0;
      const cdVatop = hasDateAndAmount ? cVact - cVatop : Number(migrated?.cdVatop) || 0;

      let lCpVatop = typeof migrated?.lCpVatop === 'number' ? migrated.lCpVatop : typeof (inv as any)?.rCpVatop === 'number' ? (inv as any).rCpVatop : 0;
      if (hasDateAndAmount) {
        const historicalLiquid = getNearestHistoricalPrice(vapaData.liquidHistory || [], normalizedDate as string);
        if (historicalLiquid) lCpVatop = historicalLiquid.price;
        else if (currentLiquidPrice != null) lCpVatop = currentLiquidPrice;
      }
      const lCpVact = currentLiquidPrice ?? lCpVatop;
      const lCVatop = hasDateAndAmount ? cVactTaa * lCpVatop : Number(migrated?.lCVatop ?? (inv as any)?.rCVatop) || 0;
      const lCVact = hasDateAndAmount ? cVactTaa * lCpVact : Number(migrated?.lCVact ?? (inv as any)?.rCVact) || 0;
      const lCdVatop = hasDateAndAmount ? lCVact - lCVatop : Number(migrated?.lCdVatop ?? (inv as any)?.rCdVatop) || 0;

      const next = {
        ...migrated,
        asset: assetId,
        date: normalizedDate ?? inv?.date,
        cVatop,
        cpVatop,
        cpVact,
        cVact,
        cdVatop,
        lCpVatop,
        lCpVact,
        lCVatop,
        lCVact,
        lCdVatop,
      };

      const keysToCheck = ['cVatop', 'cpVatop', 'cpVact', 'cVact', 'cdVatop', 'lCpVatop', 'lCpVact', 'lCVatop', 'lCVact', 'lCdVatop'] as const;
      for (const k of keysToCheck) {
        const prev = Number(inv?.[k]);
        const nxt = Number(next?.[k]);
        if (Number.isFinite(prev) && Number.isFinite(nxt) && Math.abs(prev - nxt) > 1e-9) {
          didMutate = true;
          break;
        }
      }
      if (normalizedDate && inv?.date !== normalizedDate) didMutate = true;
      if (inv?.asset !== assetId) didMutate = true;

      return next;
    });

    const totalsAll = calculateTotals(updatedAll);
    const totalsLiquidAll = calculateTotalsLiquid(updatedAll);
    const newData = { createdAt, expiresAt, investments: updatedAll, totals: totalsAll, totalsLiquid: totalsLiquidAll };

    if (didMutate) {
      await s3
        .putObject({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: JSON.stringify(newData),
          ContentType: 'application/json',
          ACL: 'private',
        })
        .promise();
    }

    if (normalizedAsset) {
      const filteredInvestments = updatedAll.filter((entry: any) => (entry?.asset || 'bitcoin') === normalizedAsset);
      const totals = calculateTotals(filteredInvestments);
      const totalsLiquid = calculateTotalsLiquid(filteredInvestments);
      return res.status(200).json({
        createdAt,
        expiresAt,
        investments: filteredInvestments,
        totals,
        totalsLiquid,
      });
    }

    return res.status(200).json(newData);
  } catch (error: any) {
    // If the file doesn't exist, return empty data structure (this is normal for new users)
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      // Don't log - this is expected behavior for new users
      return res.status(200).json({
        investments: [],
        totals: {
          acVatop: 0,
          acVact: 0,
          acdVatop: 0,
          acVactTaa: 0,
        },
        totalsLiquid: {
          acVatop: 0,
          acVact: 0,
          acdVatop: 0,
          acVactTaa: 0,
        },
      });
    }
    
    const errorMessage = error.message || 'Could not fetch user data';
    console.error('Error fetching data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

