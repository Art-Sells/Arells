import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedPrice: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = Date.now();
  if (cachedPrice != null && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    return res.status(200).json({ ethereum: { usd: cachedPrice } });
  }

  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'ethereum', vs_currencies: 'usd' },
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });
    const price = response.data?.ethereum?.usd;
    if (typeof price === 'number') {
      cachedPrice = price;
      cacheTimestamp = now;
      return res.status(200).json({ ethereum: { usd: price } });
    }
    return res.status(500).json({ error: 'Invalid price response' });
  } catch (error) {
    console.error('Error fetching Ethereum price:', error);
    if (cachedPrice != null) {
      return res.status(200).json({ ethereum: { usd: cachedPrice } });
    }
    return res.status(500).json({ error: 'Error fetching Ethereum price' });
  }
}
