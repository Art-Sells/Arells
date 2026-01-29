import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedHighestPrice: number | null = null;
let cachedHighestPriceDate: string | null = null;
let highestPriceCacheTimestamp: number | null = null;
const HIGHEST_PRICE_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Fetch the highest Bitcoin price from historical data
const fetchHighestPriceFromHistory = async (): Promise<{ price: number; date: string | null }> => {
  try {
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 'max'
      },
      headers: COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined
    });

    const prices: [number, number][] = response.data?.prices || [];
    if (prices.length === 0) {
      return { price: 0, date: null };
    }

    let highest = prices[0];
    for (const entry of prices) {
      if (entry[1] > highest[1]) {
        highest = entry;
      }
    }

    return {
      price: highest[1],
      date: new Date(highest[0]).toISOString()
    };
  } catch (error) {
    console.error('Error fetching historical Bitcoin price:', error);
    return { price: 0, date: null };
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  // Get the highest price from historical data
  // Cache it for 5 seconds since historical data doesn't change often
  let highestPriceEver: number;
  let highestPriceDate: string | null;
  
  if (cachedHighestPrice && highestPriceCacheTimestamp && 
      currentTime - highestPriceCacheTimestamp < HIGHEST_PRICE_CACHE_DURATION) {
    highestPriceEver = cachedHighestPrice;
    highestPriceDate = cachedHighestPriceDate;
  } else {
    // Fetch from historical data
    const highest = await fetchHighestPriceFromHistory();
    highestPriceEver = highest.price;
    highestPriceDate = highest.date;
    if (highestPriceEver > 0) {
      cachedHighestPrice = highestPriceEver;
      cachedHighestPriceDate = highestPriceDate;
      highestPriceCacheTimestamp = currentTime;
    } else if (cachedHighestPrice) {
      highestPriceEver = cachedHighestPrice;
      highestPriceDate = cachedHighestPriceDate ?? null;
    }
  }

  // Return the highest price ever recorded
  res.status(200).json({ 
    highestPriceEver: highestPriceEver,
    highestPriceDate: highestPriceDate
  });
}


