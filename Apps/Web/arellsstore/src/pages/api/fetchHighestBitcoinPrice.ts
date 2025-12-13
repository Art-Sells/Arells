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
    // OLD CODE - COMMENTED OUT
    // // Fetch historical data (5 years) to find the highest price
    // const response = await axios.get('https://pro-api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
    //   params: {
    //     vs_currency: 'usd',
    //     days: 1825 // 5 years of data
    //   },
    //   headers: {
    //     'x-cg-pro-api-key': COINGECKO_API_KEY
    //   }
    // });
    //
    // // Find the highest price in the historical data
    // const prices = response.data.prices || [];
    // let highestPrice = 0;
    // 
    // for (const priceData of prices) {
    //   const price = priceData[1]; // [timestamp, price]
    //   if (price > highestPrice) {
    //     highestPrice = price;
    //   }
    // }
    //
    // return highestPrice;

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

  // Return the highest price ever recorded from CoinGecko
  res.status(200).json({ 
    highestPriceEver: highestPriceEver
  });
}


