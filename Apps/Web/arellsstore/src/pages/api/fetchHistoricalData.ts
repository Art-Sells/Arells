import type { NextApiRequest, NextApiResponse } from 'next';
// import axios from 'axios';
import { getSyntheticMarketChart } from '../../lib/test/synthetic-market-chart-api';

// const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedHistoricalData: any | null = null;
let historicalCacheTimestamp: number | null = null;
const HISTORICAL_CACHE_DURATION = 5000; // 5 seconds in milliseconds

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  // OLD CODE - COMMENTED OUT
  // if (!COINGECKO_API_KEY) {
  //   console.error('COINGECKO_API_KEY is not set');
  //   res.status(500).json({ error: 'Internal Server Error' });
  //   return;
  // }

  if (cachedHistoricalData && historicalCacheTimestamp && currentTime - historicalCacheTimestamp < HISTORICAL_CACHE_DURATION) {
    res.status(200).json(cachedHistoricalData);
    return;
  }

  try {
    // OLD CODE - COMMENTED OUT
    // const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
    //   params: {
    //     vs_currency: 'usd',
    //     days: 1825 
    //   },
    //   headers: {
    //     'x-cg-pro-api-key': COINGECKO_API_KEY
    //   }
    // });
    //
    // cachedHistoricalData = response.data;
    // historicalCacheTimestamp = currentTime;
    //
    // res.status(200).json(response.data);

    // NEW CODE - Using synthetic market chart API
    const syntheticData = getSyntheticMarketChart();
    // Format to match CoinGecko response structure
    cachedHistoricalData = {
      prices: syntheticData.prices,
      market_caps: syntheticData.market_caps,
      total_volumes: syntheticData.total_volumes
    };
    historicalCacheTimestamp = currentTime;

    res.status(200).json(cachedHistoricalData);
  } catch (error) {
    // OLD CODE - COMMENTED OUT
    // if (axios.isAxiosError(error)) {
    //   console.error('Axios error:', error.message, error.response?.data);
    //   res.status(error.response?.status || 500).json({ error: error.message });
    // } else {
    //   console.error('Unexpected error:', error);
    //   res.status(500).json({ error: 'Internal Server Error' });
    // }

    // NEW CODE
    console.error('Error fetching synthetic historical data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}