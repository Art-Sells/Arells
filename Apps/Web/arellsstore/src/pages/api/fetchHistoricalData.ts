import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NEXT_PUBLIC_COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
let cachedHistoricalData: any | null = null;
let historicalCacheTimestamp: number | null = null;
const HISTORICAL_CACHE_DURATION = 3600000; // 1 hour in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  if (!NEXT_PUBLIC_COINGECKO_API_KEY) {
    console.error('COINGECKO_API_KEY is not set');
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  if (cachedHistoricalData && historicalCacheTimestamp && currentTime - historicalCacheTimestamp < HISTORICAL_CACHE_DURATION) {
    res.status(200).json(cachedHistoricalData);
    return;
  }

  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 365
      },
      headers: {
        'x-cg-pro-api-key': NEXT_PUBLIC_COINGECKO_API_KEY
      }
    });

    cachedHistoricalData = response.data;
    historicalCacheTimestamp = currentTime;

    res.status(200).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message, error.response?.data);
      res.status(error.response?.status || 500).json({ error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}