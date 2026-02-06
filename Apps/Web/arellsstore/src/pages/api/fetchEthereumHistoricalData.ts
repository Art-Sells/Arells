import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedHistoricalData: any | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5000; // 5 seconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = Date.now();
  if (cachedHistoricalData && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION) {
    return res.status(200).json(cachedHistoricalData);
  }

  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/ethereum/market_chart', {
      params: { vs_currency: 'usd', days: 'max' },
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });
    cachedHistoricalData = response.data;
    cacheTimestamp = now;
    return res.status(200).json(cachedHistoricalData);
  } catch (error) {
    console.error('Error fetching historical Ethereum data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
