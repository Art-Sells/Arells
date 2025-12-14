import type { NextApiRequest, NextApiResponse } from 'next';
// import axios from 'axios';
import { getSyntheticPriceResponse } from '../../lib/test/synthetic-price-api';

// const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedPrice: number | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000; // 1 second in milliseconds (to see decreases in synthetic price)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  // Fetch current Bitcoin price
  let currentPrice: number;
  
  if (cachedPrice && cacheTimestamp && currentTime - cacheTimestamp < CACHE_DURATION) {
    currentPrice = cachedPrice;
  } else {
    // NEW CODE - Using synthetic price API (for Bitcoin)
    try {
      const syntheticResponse = getSyntheticPriceResponse();
      currentPrice = syntheticResponse['bitcoin'].usd; // Using same synthetic API structure
      cachedPrice = currentPrice;
      cacheTimestamp = currentTime;
    } catch (error) {
      console.error('Error fetching synthetic Bitcoin price:', error);
      // If fetch fails but we have a cached price, use that
      if (cachedPrice) {
        currentPrice = cachedPrice;
      } else {
        return res.status(500).json({ error: 'Error fetching Bitcoin price' });
      }
    }
  }

  // Return the current Bitcoin price
  res.status(200).json({ 
    'bitcoin': { 
      usd: currentPrice // Return current price
    } 
  });
}