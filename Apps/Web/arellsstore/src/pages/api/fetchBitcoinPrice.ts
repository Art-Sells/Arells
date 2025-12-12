import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
let cachedPrice: number | null = null;
let cacheTimestamp: number | null = null;
let cachedHighestPrice: number | null = null;
let highestPriceCacheTimestamp: number | null = null;
const CACHE_DURATION = 60000; // 1 minute in milliseconds
const HIGHEST_PRICE_CACHE_DURATION = 3600000; // 1 hour for historical data

// Fetch the highest Bitcoin price from CoinGecko historical data
const fetchHighestPriceFromHistory = async (): Promise<number> => {
  try {
    // Fetch historical data (5 years) to find the highest price
    const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
      params: {
        vs_currency: 'usd',
        days: 1825 // 5 years of data
      },
      headers: {
        'x-cg-pro-api-key': COINGECKO_API_KEY
      }
    });

    // Find the highest price in the historical data
    const prices = response.data.prices || [];
    let highestPrice = 0;
    
    for (const priceData of prices) {
      const price = priceData[1]; // [timestamp, price]
      if (price > highestPrice) {
        highestPrice = price;
      }
    }

    return highestPrice;
  } catch (error) {
    console.error('Error fetching historical Bitcoin price:', error);
    return 0;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const currentTime = Date.now();

  // Always fetch current price to check if it's higher than our record
  let currentPrice: number;
  
  if (cachedPrice && cacheTimestamp && currentTime - cacheTimestamp < CACHE_DURATION) {
    currentPrice = cachedPrice;
  } else {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'bitcoin',
          vs_currencies: 'usd'
        },
        headers: {
          'x-cg-pro-api-key': COINGECKO_API_KEY
        }
      });

      currentPrice = response.data['bitcoin'].usd;
      cachedPrice = currentPrice;
      cacheTimestamp = currentTime;
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      // If fetch fails but we have a cached price, use that
      if (cachedPrice) {
        currentPrice = cachedPrice;
      } else {
        return res.status(500).json({ error: 'Error fetching Bitcoin price' });
      }
    }
  }

  // Get the highest price from CoinGecko historical data
  // Cache it for 1 hour since historical data doesn't change often
  let highestPriceEver: number;
  
  if (cachedHighestPrice && highestPriceCacheTimestamp && 
      currentTime - highestPriceCacheTimestamp < HIGHEST_PRICE_CACHE_DURATION) {
    highestPriceEver = cachedHighestPrice;
  } else {
    // Fetch from CoinGecko historical data
    highestPriceEver = await fetchHighestPriceFromHistory();
    cachedHighestPrice = highestPriceEver;
    highestPriceCacheTimestamp = currentTime;
  }

  // Compare with current price and use the higher one
  // This ensures we always show the absolute highest (historical or current)
  const absoluteHighest = Math.max(highestPriceEver, currentPrice);

  // Return the highest price ever recorded (from historical data or current, whichever is higher)
  res.status(200).json({ 
    'bitcoin': { 
      usd: absoluteHighest, // Always return the highest price ever
      currentPrice: currentPrice, // Also include current price for reference
      highestPriceEver: absoluteHighest
    } 
  });
}