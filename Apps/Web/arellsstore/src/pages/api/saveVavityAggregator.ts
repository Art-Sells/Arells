import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import axios from 'axios';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const VAPA_KEY = 'vavity/VAPA.json';

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

const loadVapaData = async (): Promise<{ vapa: number; history: { date: string; price: number }[] }> => {
  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
    const data = response.Body ? JSON.parse(response.Body.toString()) : {};
    return {
      vapa: typeof data.vapa === 'number' ? data.vapa : 0,
      history: Array.isArray(data.history) ? data.history : [],
    };
  } catch (error) {
    return { vapa: 0, history: [] };
  }
};

const loadCurrentBitcoinPrice = async (): Promise<number | null> => {
  try {
    const response = await axios
      .get('http://localhost:3000/api/bitcoinPrice', { timeout: 5000 })
      .catch(() => axios.get('/api/bitcoinPrice', { timeout: 5000 }));
    const price = response.data?.bitcoin?.usd;
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, investments } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const key = `${email}/VavityAggregate.json`;

    // Fetch existing data from S3
    let existingData: any = {};
    try {
      const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
      existingData = JSON.parse(data.Body!.toString());
    } catch (err: any) {
      if (err.code === 'NoSuchKey') {
        console.warn("⚠️ No existing data found for user:", email);
        existingData = { investments: [] };
      } else {
        throw err;
      }
    }

    const existingInvestments = Array.isArray(existingData.investments) ? existingData.investments : [];
    const incomingInvestments = Array.isArray(investments) ? investments : existingInvestments;

    const vapaData = await loadVapaData();
    const currentPrice = await loadCurrentBitcoinPrice();

    const normalizedInvestments = incomingInvestments.map((inv: any) => {
      const rawAmount = inv.cVactTaa ?? 0;
      const cVactTaa = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount) || 0;
      const normalizedDate = typeof inv.date === 'string' ? normalizeToIsoDay(inv.date) : null;
      const hasDateAndAmount = Boolean(normalizedDate) && cVactTaa > 0;

      let cpVatop = typeof inv.cpVatop === 'number' ? inv.cpVatop : 0;
      if (hasDateAndAmount) {
        const historical = getNearestHistoricalPrice(vapaData.history, normalizedDate as string);
        if (historical) {
          cpVatop = historical.price;
        } else if (currentPrice !== null) {
          cpVatop = currentPrice;
        }
      }

      const cpVact = vapaData.vapa || cpVatop;
      const cVatop = hasDateAndAmount ? cVactTaa * cpVatop : inv.cVatop ?? cVactTaa * cpVatop;
      const cVact = hasDateAndAmount ? cVactTaa * cpVact : inv.cVact ?? cVactTaa * cpVact;
      const cdVatop = hasDateAndAmount ? cVact - cVatop : inv.cdVatop ?? cVact - cVatop;

      return {
        ...inv,
        date: normalizedDate ?? inv.date,
        cVatop,
        cpVatop,
        cVactTaa,
        cpVact,
        cVact,
        cdVatop,
      };
    });

    const totals = calculateTotals(normalizedInvestments);

    const newData = {
      investments: normalizedInvestments,
      totals,
    };

    // Save the updated data back to S3
    await s3
      .putObject({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(newData),
        ContentType: 'application/json',
        ACL: 'private',
      })
      .promise();

    return res.status(200).json({ message: 'Data saved successfully', data: newData });
  } catch (error) {
    console.error('❌ Error during processing:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export default handler;
