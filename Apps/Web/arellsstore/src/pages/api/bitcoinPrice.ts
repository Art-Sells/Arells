import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedPrice: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  if (cachedPrice && cacheTimestamp && currentTime - cacheTimestamp < CACHE_DURATION) {
    res.status(200).json({ 'bitcoin': { usd: cachedPrice } });
    return;
  }

  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd'
      },
      headers: {
        'x-cg-pro-api-key': COINGECKO_API_KEY
      }
    });

    cachedPrice = response.data['bitcoin'].usd;
    cacheTimestamp = currentTime;

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    if (cachedPrice !== null) {
      res.status(200).json({ 'bitcoin': { usd: cachedPrice } });
      return;
    }
    res.status(500).json({ error: 'Error fetching Bitcoin price' });
  }
}