// lib/coingecko-api.ts
import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export const fetchBitcoinPrice = async (): Promise<number> => {
  try {
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