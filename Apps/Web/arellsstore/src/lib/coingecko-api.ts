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
export const setManualBitcoinPrice = (price: number): void => {
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

// Function to manually update the Bitcoin price for testing
export const updateManualBitcoinPrice = async (): Promise<number> => {
  const price = await fetchBitcoinPrice();
  setManualBitcoinPrice(price);
  return price;
};

// Example usage: Manually set the Bitcoin price without logging
(async () => {
  try {
    await updateManualBitcoinPrice();
  } catch (error) {
    console.error('Error updating manual Bitcoin price:', error);
  }
})();