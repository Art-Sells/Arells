import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const ETH_VAPA_KEY = 'vavity/ethereumVAPA.json';

const normalizeToIsoDay = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const dateParam = typeof req.query.date === 'string' ? req.query.date : null;
  const targetDay = dateParam ? normalizeToIsoDay(dateParam) : null;
  if (!targetDay) return res.status(400).json({ error: 'Missing or invalid date' });

  try {
    const data = await s3.getObject({ Bucket: BUCKET_NAME, Key: ETH_VAPA_KEY }).promise();
    const json = JSON.parse(data.Body!.toString());
    const history: { date: string; price: number }[] = Array.isArray(json.history) ? json.history : [];
    let nearestPrice = null;
    for (const entry of history) {
      if (entry.date === targetDay) {
        nearestPrice = entry.price;
        break;
      }
    }
    if (nearestPrice == null && history.length) {
      nearestPrice = history[history.length - 1].price;
    }
    return res.status(200).json({ price: nearestPrice });
  } catch (error: any) {
    console.error('[ethereumVapaHistoricalPrice] error', error);
    return res.status(500).json({ error: 'Failed to fetch historical price' });
  }
}
