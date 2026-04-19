import type { NextApiRequest, NextApiResponse } from 'next';
import { logApiRouteError, withOptionalApiDebug } from '../../lib/server/apiErrorDebug';
import { loadCurrentAssetSpotPrice } from '../../lib/server/assetSpotPrice';
import { getServerS3 } from '../../lib/server/awsS3';
import { s3BucketNameOrThrow } from '../../lib/server/s3Bucket';

const s3 = getServerS3();
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
  solana: 'vavity/solanaVAPA.json',
};

const normalizeToIsoDay = (value: string): string | null => {
  if (!value) return null;
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts;
    if (!year || !month || !day) return null;
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (value.includes('-')) {
    const parts = value.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
};

const getNearestHistoricalPrice = (
  history: { date: string; price: number }[],
  targetDate: string
): { date: string; price: number } | null => {
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let selected: { date: string; price: number } | null = null;
  for (const entry of sorted) {
    if (entry.date <= targetDate) {
      selected = entry;
    } else {
      break;
    }
  }
  return selected;
};

const loadVapaData = async (
  asset: string
): Promise<{
  vapa: number;
  price: number | null;
  solidHistory: { date: string; price: number }[];
  liquidHistory: { date: string; price: number }[];
}> => {
  const key = VAPA_KEYS[asset] || VAPA_KEYS.bitcoin;
  try {
    const response = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
    const data = response.Body ? JSON.parse(response.Body.toString()) : {};
    return {
      vapa: typeof data.vapa === 'number' ? data.vapa : 0,
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
      price: typeof data.price === 'number' ? data.price : null,
    };
  } catch (error) {
    return { vapa: 0, solidHistory: [], liquidHistory: [], price: null };
  }
};

const loadCurrentPrice = loadCurrentAssetSpotPrice;

// Calculate totals for investments
const calculateTotals = (investments: any[]) => {
  return investments.reduce(
    (acc, inv) => {
      const cVatop = inv.cVatop || 0;
      const cVact = inv.cVact || 0;
      const cdVatop = inv.cdVatop || 0;
      const cVactTaa = inv.cVactTaa ?? 0;
      return {
        acVatop: acc.acVatop + cVatop,
        acVact: acc.acVact + cVact,
        acdVatop: acc.acdVatop + cdVatop,
        acVactTaa: acc.acVactTaa + cVactTaa,
      };
    },
    { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
  );
};

const calculateTotalsLiquid = (investments: any[]) => {
  return investments.reduce(
    (acc, inv) => {
      const cVatop = inv.lCVatop ?? inv.rCVatop ?? 0;
      const cVact = inv.lCVact ?? inv.rCVact ?? 0;
      const cdVatop = inv.lCdVatop ?? inv.rCdVatop ?? 0;
      const cVactTaa = inv.cVactTaa ?? 0;
      return {
        acVatop: acc.acVatop + cVatop,
        acVact: acc.acVact + cVact,
        acdVatop: acc.acdVatop + cdVatop,
        acVactTaa: acc.acVactTaa + cVactTaa,
      };
    },
    { acVatop: 0, acVact: 0, acdVatop: 0, acVactTaa: 0 }
  );
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, investments, asset: rawAsset, skipExpiry: rawSkipExpiry } = req.body;
  const asset = typeof rawAsset === 'string' && rawAsset.length ? rawAsset.toLowerCase() : 'bitcoin';
  const skipExpiry =
    typeof rawSkipExpiry === 'string'
      ? ['1', 'true', 'yes', 'on'].includes(rawSkipExpiry.toLowerCase())
      : Boolean(rawSkipExpiry);

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  try {
    const key = `sessions/${sessionId}/VavityAggregate.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("⚠️ No existing data found for session:", sessionId);
        existingData = { investments: [] };
      } else {
        throw err;
      }
    }

    const existingInvestmentsRaw = Array.isArray(existingData.investments) ? existingData.investments : [];
    const incomingInvestmentsRaw = Array.isArray(investments) ? investments : existingInvestmentsRaw;
    const filteredExistingInvestments = existingInvestmentsRaw.filter((inv: any) => {
      const invAsset =
        typeof inv?.asset === 'string' && inv.asset.length ? inv.asset.toLowerCase() : 'bitcoin';
      return invAsset !== asset;
    });

    // Session TTL meta: start countdown when the session JSON is first created.
    // If the existing session is expired, rotate meta and treat this save as a fresh session.
    const now = Date.now();
    const existingCreatedAt = typeof existingData?.createdAt === 'number' ? existingData.createdAt : null;
    const existingExpiresAt = typeof existingData?.expiresAt === 'number' ? existingData.expiresAt : null;
    const expired = !skipExpiry && typeof existingExpiresAt === 'number' && Number.isFinite(existingExpiresAt) && now >= existingExpiresAt;
    const createdAt = expired ? now : existingCreatedAt ?? now;
    // Reset session TTL on every save (session-only behavior).
    const expiresAt = now + SESSION_TTL_MS;

    const vapaData = await loadVapaData(asset);
    const currentPrice = await loadCurrentPrice(asset);
    const currentLiquidPrice = currentPrice ?? vapaData.price;

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

    const normalizedInvestments = incomingInvestmentsRaw.map((inv: any) => {
      const migrated = normalizeExistingInvestment(inv);
      const rawAmount = inv.cVactTaa ?? 0;
      const cVactTaa = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
      const normalizedDate = typeof inv.date === 'string' ? normalizeToIsoDay(inv.date) : null;
      const hasDateAndAmount = Boolean(normalizedDate) && cVactTaa > 0;

      // Fantasy (monotonic/VAPA)
      let cpVatop = typeof migrated.cpVatop === 'number' ? migrated.cpVatop : 0;
      if (hasDateAndAmount) {
        const historical = getNearestHistoricalPrice(vapaData.solidHistory, normalizedDate as string);
        if (historical) cpVatop = historical.price;
        else if (typeof vapaData.vapa === 'number' && vapaData.vapa > 0) cpVatop = vapaData.vapa;
      }

      const cpVact = vapaData.vapa || cpVatop;
      const cVatop = hasDateAndAmount ? cVactTaa * cpVatop : migrated.cVatop ?? cVactTaa * cpVatop;
      const cVact = hasDateAndAmount ? cVactTaa * cpVact : migrated.cVact ?? cVactTaa * cpVact;
      const cdVatop = hasDateAndAmount ? cVact - cVatop : migrated.cdVatop ?? cVact - cVatop;

      // Liquid (liquid history + liquid current price)
      let lCpVatop =
        typeof migrated.lCpVatop === 'number'
          ? migrated.lCpVatop
          : typeof (migrated as any).rCpVatop === 'number'
            ? (migrated as any).rCpVatop
            : 0;
      if (hasDateAndAmount) {
        const historicalLiquid = getNearestHistoricalPrice(vapaData.liquidHistory || [], normalizedDate as string);
        if (historicalLiquid) lCpVatop = historicalLiquid.price;
        else if (currentLiquidPrice != null) lCpVatop = currentLiquidPrice;
      }
      const lCpVact = currentLiquidPrice ?? lCpVatop;
      const lCVatop = hasDateAndAmount ? cVactTaa * lCpVatop : migrated.lCVatop ?? (migrated as any).rCVatop ?? cVactTaa * lCpVatop;
      const lCVact = hasDateAndAmount ? cVactTaa * lCpVact : migrated.lCVact ?? (migrated as any).rCVact ?? cVactTaa * lCpVact;
      const lCdVatop = hasDateAndAmount ? lCVact - lCVatop : migrated.lCdVatop ?? (migrated as any).rCdVatop ?? lCVact - lCVatop;

      return {
        ...migrated,
        date: normalizedDate ?? migrated.date,
        cVatop,
        cpVatop,
        cVactTaa,
        cpVact,
        cVact,
        cdVatop,
        lCpVatop,
        lCpVact,
        lCVatop,
        lCVact,
        lCdVatop,
        asset,
      };
    });

    const mergedInvestments = [...filteredExistingInvestments, ...normalizedInvestments];
    const totals = calculateTotals(mergedInvestments);
    const totalsLiquid = calculateTotalsLiquid(mergedInvestments);

    const newData = {
      createdAt,
      expiresAt,
      investments: mergedInvestments,
      totals,
      totalsLiquid,
    };

    // Save the updated data back to S3
    await s3
      .putObject({
        Bucket: s3BucketNameOrThrow(),
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error: unknown) {
    logApiRouteError('saveVavityAggregator', error);
    return res.status(500).json(withOptionalApiDebug({ error: 'Internal Server Error' }, error));
  }
};

export default handler;
