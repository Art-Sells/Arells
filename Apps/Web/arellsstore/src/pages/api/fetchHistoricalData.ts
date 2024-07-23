import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedHistoricalData: any | null = null;
let historicalCacheTimestamp: number | null = null;
const HISTORICAL_CACHE_DURATION = 3600000; // 1 hour in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  if (cachedHistoricalData && historicalCacheTimestamp && currentTime - historicalCacheTimestamp < HISTORICAL_CACHE_DURATION) {
    res.status(200).json(cachedHistoricalData);
    return;
  }

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 365
      },
      headers: {
        'x-cg-pro-api-key': COINGECKO_API_KEY
      }
    });

    cachedHistoricalData = response.data;
    historicalCacheTimestamp = currentTime;

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching historical Bitcoin data:', error);
    res.status(500).json({ error: 'Error fetching historical Bitcoin data' });
  }
}