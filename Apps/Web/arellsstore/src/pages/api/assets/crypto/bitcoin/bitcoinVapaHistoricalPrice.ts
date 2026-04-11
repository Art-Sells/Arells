import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import { s3BucketNameOrThrow } from '../../../../../lib/server/s3Bucket';

const s3 = new AWS.S3({
  region: process.env.WS_REGION,
  accessKeyId: process.env.WS_ACCESS_KEY_ID,
  secretAccessKey: process.env.WS_SECRET_ACCESS_KEY,
});
const BITCOIN_VAPA_KEY = 'vavity/bitcoinVAPA.json';

const normalizeToIsoDay = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const sanitizeHistory = (history: any[]) => {
  return (Array.isArray(history) ? history : [])
    .map((entry) => {
      const day = typeof entry?.date === 'string' ? normalizeToIsoDay(entry.date) : null;
      const priceNum = Number(entry?.price);
      if (!day) return null;
      if (!Number.isFinite(priceNum)) return null;
      return { date: day, price: priceNum };
    })
    .filter(Boolean) as { date: string; price: number }[];
};

const getNearestHistoricalPrice = (history: { date: string; price: number }[], targetDay: string) => {
  if (!history.length) return null;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let selected: { date: string; price: number } | null = null;
  for (const entry of sorted) {
    if (entry.date <= targetDay) selected = entry;
    else break;
  }
  return selected;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const dateParam = typeof req.query.date === 'string' ? req.query.date : null;
  const targetDay = dateParam ? normalizeToIsoDay(dateParam) : null;
  if (!targetDay) return res.status(400).json({ error: 'Missing or invalid date' });
  const modeParam = typeof req.query.mode === 'string' ? req.query.mode : '';
  const modeRaw = modeParam?.toLowerCase();
  const mode = modeRaw === 'liquid' || modeRaw === 'real' ? 'liquid' : 'solid';

  try {
    const data = await s3.getObject({ Bucket: s3BucketNameOrThrow(), Key: BITCOIN_VAPA_KEY }).promise();
    const json = JSON.parse(data.Body!.toString());
    const rawHistory =
      mode === 'liquid'
        ? (Array.isArray(json.liquidHistory) ? json.liquidHistory : (Array.isArray(json.realHistory) ? json.realHistory : []))
        : (Array.isArray(json.solidHistory) ? json.solidHistory : (Array.isArray(json.history) ? json.history : []));
    const history = sanitizeHistory(rawHistory);

    const nearest = getNearestHistoricalPrice(history, targetDay);
    const price = nearest?.price ?? (history.length ? history[history.length - 1].price : null);
    return res.status(200).json({ price });
  } catch (error: any) {
    console.error('[bitcoinVapaHistoricalPrice] error', error);
    return res.status(500).json({ error: 'Failed to fetch historical price' });
  }
}
