import type { NextApiRequest, NextApiResponse } from 'next';
import AWS from 'aws-sdk';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dateParam = typeof req.query.date === 'string' ? req.query.date : '';
  const targetDate = normalizeToIsoDay(dateParam);
  if (!targetDate) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY.' });
  }

  try {
    const response = await s3.getObject({ Bucket: BUCKET_NAME, Key: VAPA_KEY }).promise();
    if (!response.Body) {
      return res.status(404).json({ error: 'VAPA history not found.' });
    }

    const data = JSON.parse(response.Body.toString());
    const history: { date: string; price: number }[] = Array.isArray(data.history) ? data.history : [];
    if (!history.length) {
      return res.status(404).json({ error: 'VAPA history not found.' });
    }

    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    let selected: { date: string; price: number } | null = null;
    for (const entry of sorted) {
      if (entry.date <= targetDate) {
        selected = entry;
      } else {
        break;
      }
    }

    if (!selected) {
      return res.status(404).json({ error: 'No historical price found for that date.' });
    }

    return res.status(200).json({ date: selected.date, price: selected.price });
  } catch (error: any) {
    console.error('[vapaHistoricalPrice] Error reading VAPA history:', error);
    return res.status(500).json({ error: 'Failed to read VAPA history.' });
  }
}
