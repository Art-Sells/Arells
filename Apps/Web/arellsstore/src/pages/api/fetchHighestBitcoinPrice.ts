import type { NextApiRequest, NextApiResponse } from 'next';
// import axios from 'axios';
import { getSyntheticMarketChart } from '../../lib/test/synthetic-market-chart-api';

// const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedHighestPrice: number | null = null;
let highestPriceCacheTimestamp: number | null = null;
const HIGHEST_PRICE_CACHE_DURATION = 5000; // 5 seconds in milliseconds

// Fetch the highest Bitcoin price from synthetic historical data
const fetchHighestPriceFromHistory = async (): Promise<number> => {
  try {
    // NEW CODE - Using synthetic market chart API
    const syntheticData = getSyntheticMarketChart();
    return syntheticData.highestPrice;
  } catch (error) {
    console.error('Error fetching historical Bitcoin price:', error);
    return 0;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  // Get the highest price from historical data
  // Cache it for 5 seconds since historical data doesn't change often
  let highestPriceEver: number;
  
  if (cachedHighestPrice && highestPriceCacheTimestamp && 
      currentTime - highestPriceCacheTimestamp < HIGHEST_PRICE_CACHE_DURATION) {
    highestPriceEver = cachedHighestPrice;
  } else {
    // Fetch from historical data
    highestPriceEver = await fetchHighestPriceFromHistory();
    cachedHighestPrice = highestPriceEver;
    highestPriceCacheTimestamp = currentTime;
  }

  // Return the highest price ever recorded
  res.status(200).json({ 
    highestPriceEver: highestPriceEver
  });
}


