import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedHistoricalData: any | null = null;
let historicalCacheTimestamp: number | null = null;
const HISTORICAL_CACHE_DURATION = 5000; // 5 seconds in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  if (cachedHistoricalData && historicalCacheTimestamp && currentTime - historicalCacheTimestamp < HISTORICAL_CACHE_DURATION) {
    res.status(200).json(cachedHistoricalData);
    return;
  }

  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 'max'
      },
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });

    cachedHistoricalData = response.data;
    historicalCacheTimestamp = currentTime;

    res.status(200).json(cachedHistoricalData);
  } catch (error) {
    console.error('Error fetching historical Bitcoin data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}