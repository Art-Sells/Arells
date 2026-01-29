import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const priceCache: Record<string, { price: number; timestamp: number }> = {};

const formatCoingeckoDate = (date: string): string | null => {
  if (date.includes('/')) {
    const parts = date.split('/');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts;
    if (!year || !month || !day) return null;
    return `${day}-${month}-${year}`;
  }

  const parts = date.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return `${day}-${month}-${year}`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const date = typeof req.query.date === 'string' ? req.query.date : '';
  const formattedDate = formatCoingeckoDate(date);

  if (!formattedDate) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY.' });
  }

  const cached = priceCache[date];
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return res.status(200).json({ date, price: cached.price });
  }

  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/history', {
      params: {
        date: formattedDate
      },
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });

    const price = response.data?.market_data?.current_price?.usd;
    if (typeof price !== 'number') {
      return res.status(404).json({ error: 'No price data for that date.' });
    }

    priceCache[date] = { price, timestamp: now };
    return res.status(200).json({ date, price });
  } catch (error) {
    console.error('Error fetching historical Bitcoin price:', error);
    return res.status(500).json({ error: 'Failed to fetch historical price.' });
  }
}
