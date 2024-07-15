import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Variable to set the Bitcoin price manually
let manualBitcoinPrice: number | null = null;

// Function to set the manual Bitcoin price
export const setManualBitcoinPrice = (price: number): void => {
  manualBitcoinPrice = price;
};

// Function to fetch the Bitcoin price
export const fetchBitcoinPrice = async (): Promise<number> => {
  try {
    // If a manual price is set, return it
    if (manualBitcoinPrice !== null) {
      return manualBitcoinPrice;
    }

    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
      },
    });
    return response.data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw new Error('Could not fetch Bitcoin price');
  }
};

// Function to manually update the Bitcoin price for testing
export const updateManualBitcoinPrice = (price: number): void => {
  setManualBitcoinPrice(price);
};

// Manually set the Bitcoin price
updateManualBitcoinPrice(62000); // Set the manual price to 50,000