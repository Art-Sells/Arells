import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const VAPA_KEYS: Record<string, string> = {
  bitcoin: 'vavity/bitcoinVAPA.json',
  ethereum: 'vavity/ethereumVAPA.json'
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
): Promise<{ vapa: number; price: number | null; history: { date: string; price: number }[]; realHistory: { date: string; price: number }[] }> => {
  const key = VAPA_KEYS[asset] || VAPA_KEYS.bitcoin;
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const data = response.Body ? JSON.parse(response.Body.toString()) : {};
    return {
      vapa: typeof data.vapa === 'number' ? data.vapa : 0,
      history: Array.isArray(data.history) ? data.history : [],
      realHistory: Array.isArray(data.realHistory) ? data.realHistory : [],
      price: typeof data.price === 'number' ? data.price : null,
    };
  } catch (error) {
    return { vapa: 0, history: [], realHistory: [], price: null };
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
  } catch (error) {
    return null;
  }
};

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

const calculateTotalsReality = (investments: any[]) => {
  return investments.reduce(
    (acc, inv) => {
      const cVatop = inv.rCVatop || 0;
      const cVact = inv.rCVact || 0;
      const cdVatop = inv.rCdVatop || 0;
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

  const { sessionId, newInvestments, asset: rawAsset } = req.body;
  const asset = typeof rawAsset === 'string' && rawAsset.length ? rawAsset.toLowerCase() : 'bitcoin';

  if (!sessionId || !Array.isArray(newInvestments) || newInvestments.length === 0) {
    console.error("Invalid request data:", { sessionId, newInvestments });
    return res.status(400).json({ error: 'Invalid request: Missing sessionId or newInvestments' });
  }

  try {
    const key = `sessions/${sessionId}/VavityAggregate.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("No existing data found for session:", sessionId);
      } else {
        throw err;
      }
    }

    const existingInvestments = Array.isArray(existingData.investments) ? existingData.investments : [];

    const vapaData = await loadVapaData(asset);
    const currentPrice = await loadCurrentPrice(asset);
    const currentRealPrice = currentPrice ?? vapaData.price;

    const normalizedNewInvestments = newInvestments.map((inv: any) => {
      const rawAmount = inv.cVactTaa ?? 0;
      const cVactTaa = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
      const normalizedDate = typeof inv.date === 'string' ? normalizeToIsoDay(inv.date) : null;
      const hasDateAndAmount = Boolean(normalizedDate) && cVactTaa > 0;

      let cpVatop = typeof inv.cpVatop === 'number' ? inv.cpVatop : 0;
      if (hasDateAndAmount) {
        const historical = getNearestHistoricalPrice(vapaData.history, normalizedDate as string);
        if (historical) {
          cpVatop = historical.price;
        } else if (currentRealPrice != null) {
          cpVatop = currentRealPrice;
        }
      }

      const cpVact = vapaData.vapa || cpVatop;
      const cVatop = hasDateAndAmount ? cVactTaa * cpVatop : inv.cVatop ?? cVactTaa * cpVatop;
      const cVact = hasDateAndAmount ? cVactTaa * cpVact : inv.cVact ?? cVactTaa * cpVact;
      const cdVatop = hasDateAndAmount ? cVact - cVatop : inv.cdVatop ?? cVact - cVatop;

      let rCpVatop = typeof inv.rCpVatop === 'number' ? inv.rCpVatop : 0;
      if (hasDateAndAmount) {
        const historicalReal = getNearestHistoricalPrice(vapaData.realHistory || [], normalizedDate as string);
        if (historicalReal) {
          rCpVatop = historicalReal.price;
        } else if (currentRealPrice != null) {
          rCpVatop = currentRealPrice;
        }
      }
      const rCpVact = currentRealPrice ?? rCpVatop;
      const rCVatop = hasDateAndAmount ? cVactTaa * rCpVatop : inv.rCVatop ?? cVactTaa * rCpVatop;
      const rCVact = hasDateAndAmount ? cVactTaa * rCpVact : inv.rCVact ?? cVactTaa * rCpVact;
      const rCdVatop = hasDateAndAmount ? rCVact - rCVatop : inv.rCdVatop ?? rCVact - rCVatop;

      return {
        ...inv,
        date: normalizedDate ?? inv.date,
        cVatop,
        cpVatop,
        cVactTaa,
        cpVact,
        cVact,
        cdVatop,
        rCpVatop,
        rCpVact,
        rCVatop,
        rCVact,
        rCdVatop,
        asset,
      };
    });

    const updatedInvestments = [...existingInvestments, ...normalizedNewInvestments];
    const totals = calculateTotals(updatedInvestments);
    const totalsReality = calculateTotalsReality(updatedInvestments);

    const newData = {
      investments: updatedInvestments,
      totals,
      totalsReality,
    };

    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ 
      message: 'New groups added successfully', 
      data: newData 
    });
  } catch (error) {
    console.error('Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;

