// src/lib/coingecko-api.ts

import axios from 'axios';

// Variable to set the Ethereum price manually
let manualEthereumPrice: number | null = null;

// Function to set the manual Ethereum price
export const setManualEthereumPrice = (price: number | null): void => {
  manualEthereumPrice = price;
};

export const fetchEthereumPrice = async (): Promise<number> => {
  if (manualEthereumPrice !== null) {
    return manualEthereumPrice;
  }

  try {
    const response = await axios.get('/api/fetchEthereumPrice');

    // The API returns the current Ethereum price
    const ethereumData = response.data?.['ethereum'];
    if (!ethereumData) {
      throw new Error('Invalid response structure from API');
    }

    // Return the current price
    return ethereumData.usd;
  } catch (error) {
    console.error('Error fetching Ethereum price:', error);
    throw new Error('Could not fetch Ethereum price');
  }
};

// Function to fetch the Ethereum price data (with date)
export const fetchEthereumPriceData = async (): Promise<{ x: Date, y: number }> => {
  try {
    const response = await axios.get('/api/fetchEthereumPrice');
    return { x: new Date(), y: response.data['ethereum'].usd };
  } catch (error) {
    console.error('Error fetching Ethereum price data:', error);
    throw new Error('Could not fetch Ethereum price data');
  }
};

// Function to fetch historical Ethereum data
export const fetchHistoricalData = async (): Promise<{ x: Date, y: number }[]> => {
  try {
    const response = await axios.get('/api/fetchHistoricalData');
    return response.data.prices.map((price: [number, number]) => ({
      x: new Date(price[0]),
      y: price[1]
    }));
  } catch (error) {
    console.error('Error fetching historical Ethereum data:', error);
    throw new Error('Could not fetch historical Ethereum data');
  }
};

// Function to filter price data
export const filterPriceData = (prices: { x: Date, y: number }[]): { x: Date, y: number }[] => {
  const filteredPrices: { x: Date, y: number }[] = [];
  let lastValidPrice = prices[0]?.y;

  for (const price of prices) {
    if (price.y >= lastValidPrice) {
      filteredPrices.push(price);
      lastValidPrice = price.y;
    } else {
      filteredPrices.push({ x: price.x, y: lastValidPrice });
    }
  }

  return filteredPrices;
};

// Function to manually update the Ethereum price for testing
export const updateManualEthereumPrice = async (): Promise<number> => {
  const price = await fetchEthereumPrice();
  setManualEthereumPrice(price);
  return price;
};
