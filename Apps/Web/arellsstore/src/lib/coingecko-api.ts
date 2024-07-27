import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configure axios to retry on failure
axiosRetry(axios, {
  retries: 2,
  retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
  retryCondition: (error) => axios.isAxiosError(error) && error.response?.status === 429,
});

// Variable to set the Bitcoin price manually
let manualBitcoinPrice: number | null = null;

// Function to set the manual Bitcoin price
export const setManualBitcoinPrice = (price: number | null): void => {
  manualBitcoinPrice = price;
};

// Function to fetch the Bitcoin price
export const fetchBitcoinPrice = async (): Promise<number> => {
  if (manualBitcoinPrice !== null) {
    return manualBitcoinPrice;
  }

  try {
    const response = await axios.get('/api/fetchBitcoinPrice');
    return response.data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw new Error('Could not fetch Bitcoin price');
  }
};

// Function to fetch the Bitcoin price data (with date)
export const fetchBitcoinPriceData = async (): Promise<{ x: Date, y: number }> => {
  try {
    const response = await axios.get('/api/fetchBitcoinPrice');
    return { x: new Date(), y: response.data.bitcoin.usd };
  } catch (error) {
    console.error('Error fetching Bitcoin price data:', error);
    throw new Error('Could not fetch Bitcoin price data');
  }
};

// Function to fetch historical Bitcoin data
export const fetchHistoricalData = async (): Promise<{ x: Date, y: number }[]> => {
  try {
    const response = await axios.get('/api/fetchHistoricalData');
    return response.data.prices.map((price: [number, number]) => ({
      x: new Date(price[0]),
      y: price[1]
    }));
  } catch (error) {
    console.error('Error fetching historical Bitcoin data:', error);
    throw new Error('Could not fetch historical Bitcoin data');
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

// Function to manually update the Bitcoin price for testing
export const updateManualBitcoinPrice = async (): Promise<number> => {
  const price = await fetchBitcoinPrice();
  setManualBitcoinPrice(price);
  return price;
};

// Example usage: Manually set the Bitcoin price
(async () => {
  try {
    // Set manual Bitcoin price to 70000
    setManualBitcoinPrice(40000);

    // Fetch current price (should return 70000)
    let currentPrice = await fetchBitcoinPrice();

    // // Reset to live price
    // setManualBitcoinPrice(null);

    // // Fetch current price (should fetch live price)
    currentPrice = await fetchBitcoinPrice();
  } catch (error) {
    console.error('Error updating manual Bitcoin price:', error);
  }
})();