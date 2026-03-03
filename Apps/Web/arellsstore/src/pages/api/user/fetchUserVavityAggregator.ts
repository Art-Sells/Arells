import { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const VAPA_KEYS: Record<string, string> = {
  bitcoin: 'vavity/bitcoinVAPA.json',
  ethereum: 'vavity/ethereumVAPA.json',
};

const normalizeEmailKey = (raw: string) => encodeURIComponent(raw.trim().toLowerCase());

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
  history: { date: string; price: number }[];
  realHistory: { date: string; price: number }[];
}> => {
  const key = VAPA_KEYS[asset] || VAPA_KEYS.bitcoin;
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const data = response.Body ? JSON.parse(response.Body.toString()) : {};
    return {
      vapa: typeof data.vapa === 'number' ? data.vapa : 0,
      price: typeof data.price === 'number' ? data.price : null,
      history: Array.isArray(data.history) ? data.history : [],
      realHistory: Array.isArray(data.realHistory) ? data.realHistory : [],
    };
  } catch {
    return { vapa: 0, price: null, history: [], realHistory: [] };
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
    (acc: any, inv: any) => {
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

const calculateTotalsReality = (investments: any[]) => {
  return investments.reduce(
    (acc: any, inv: any) => {
      const cVatop = Number(inv.rCVatop) || 0;
      const cVact = Number(inv.rCVact) || 0;
      const cdVatop = Number(inv.rCdVatop) || 0;
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

  const rawEmail = req.query.email;
  const email = Array.isArray(rawEmail) ? rawEmail[0] : rawEmail;
  const rawAsset = req.query.asset;
  const asset = Array.isArray(rawAsset) ? rawAsset[0] : rawAsset;
  const normalizedAsset = typeof asset === 'string' && asset.length ? asset.toLowerCase() : undefined;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email query parameter is required' });
  }

  const key = `users/${normalizeEmailKey(email)}/VavityAggregate.json`;

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const userData = JSON.parse(data.Body!.toString());
    const investmentsAll: any[] = Array.isArray(userData.investments) ? userData.investments : [];

    const assetsToUpdate = normalizedAsset
      ? [normalizedAsset]
      : Array.from(new Set(investmentsAll.map((i) => (i?.asset || 'bitcoin').toLowerCase())));
    const vapaCache = new Map<string, Awaited<ReturnType<typeof loadVapaData>>>();
    const currentPriceCache = new Map<string, number | null>();
    for (const a of assetsToUpdate) {
      vapaCache.set(a, await loadVapaData(a));
      currentPriceCache.set(a, await loadCurrentPrice(a));
    }

    let didMutate = false;
    const updatedAll = investmentsAll.map((inv) => {
      const assetId = (inv?.asset || 'bitcoin').toLowerCase();
      if (normalizedAsset && assetId !== normalizedAsset) return inv;
      const vapaData = vapaCache.get(assetId) ?? { vapa: 0, price: null, history: [], realHistory: [] };
      const currentRealPrice = (currentPriceCache.get(assetId) ?? null) ?? vapaData.price;

      const rawAmount = inv?.cVactTaa ?? 0;
      const cVactTaa = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
      const normalizedDate = typeof inv?.date === 'string' ? normalizeToIsoDay(inv.date) : null;
      const hasDateAndAmount = Boolean(normalizedDate) && cVactTaa > 0;

      let cpVatop = typeof inv?.cpVatop === 'number' ? inv.cpVatop : 0;
      if (hasDateAndAmount) {
        const historical = getNearestHistoricalPrice(vapaData.history, normalizedDate as string);
        if (historical) cpVatop = historical.price;
        else if (currentRealPrice != null) cpVatop = currentRealPrice;
      }
      const cpVact = vapaData.vapa || cpVatop;
      const cVatop = hasDateAndAmount ? cVactTaa * cpVatop : Number(inv?.cVatop) || 0;
      const cVact = hasDateAndAmount ? cVactTaa * cpVact : Number(inv?.cVact) || 0;
      const cdVatop = hasDateAndAmount ? cVact - cVatop : Number(inv?.cdVatop) || 0;

      let rCpVatop = typeof inv?.rCpVatop === 'number' ? inv.rCpVatop : 0;
      if (hasDateAndAmount) {
        const historicalReal = getNearestHistoricalPrice(vapaData.realHistory || [], normalizedDate as string);
        if (historicalReal) rCpVatop = historicalReal.price;
        else if (currentRealPrice != null) rCpVatop = currentRealPrice;
      }
      const rCpVact = currentRealPrice ?? rCpVatop;
      const rCVatop = hasDateAndAmount ? cVactTaa * rCpVatop : Number(inv?.rCVatop) || 0;
      const rCVact = hasDateAndAmount ? cVactTaa * rCpVact : Number(inv?.rCVact) || 0;
      const rCdVatop = hasDateAndAmount ? rCVact - rCVatop : Number(inv?.rCdVatop) || 0;

      const next = {
        ...inv,
        asset: assetId,
        date: normalizedDate ?? inv?.date,
        cVatop,
        cpVatop,
        cpVact,
        cVact,
        cdVatop,
        rCpVatop,
        rCpVact,
        rCVatop,
        rCVact,
        rCdVatop,
      };

      const keysToCheck = [
        'cVatop',
        'cpVatop',
        'cpVact',
        'cVact',
        'cdVatop',
        'rCpVatop',
        'rCpVact',
        'rCVatop',
        'rCVact',
        'rCdVatop',
      ] as const;
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
    const totalsRealityAll = calculateTotalsReality(updatedAll);
    const newData = { investments: updatedAll, totals: totalsAll, totalsReality: totalsRealityAll };

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
      const totalsReality = calculateTotalsReality(filteredInvestments);
      return res.status(200).json({
        investments: filteredInvestments,
        totals,
        totalsReality,
      });
    }

    return res.status(200).json(newData);
  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.statusCode === 404) {
      return res.status(200).json({
        investments: [],
        totals: {
          acVatop: 0,
          acVact: 0,
          acdVatop: 0,
          acVactTaa: 0,
        },
        totalsReality: {
          acVatop: 0,
          acVact: 0,
          acdVatop: 0,
          acVactTaa: 0,
        },
      });
    }
    const errorMessage = error.message || 'Could not fetch user data';
    console.error('Error fetching user data:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
};

