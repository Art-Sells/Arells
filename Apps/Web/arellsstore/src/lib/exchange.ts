import axios from 'axios';

const API_BASE_URL = 'https://api-public.sandbox.pro.coinbase.com'; 

export const buyBitcoin = async (amount: number, price: number) => {
  const response = await axios.post(
    `${API_BASE_URL}/orders`,
    {
      type: 'limit',
      side: 'buy',
      product_id: 'BTC-USD',
      price,
      size: amount,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'CB-ACCESS-KEY': process.env.COINBASE_API_KEY,
        'CB-ACCESS-SIGN': 'your-signature',
        'CB-ACCESS-TIMESTAMP': Date.now().toString(),
        'CB-ACCESS-PASSPHRASE': process.env.COINBASE_API_PASSPHRASE,
      },
    }
  );
  return response.data;
};

export const sellBitcoin = async (amount: number, price: number) => {
  const response = await axios.post(
    `${API_BASE_URL}/orders`,
    {
      type: 'limit',
      side: 'sell',
      product_id: 'BTC-USD',
      price,
      size: amount,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'CB-ACCESS-KEY': process.env.COINBASE_API_KEY,
        'CB-ACCESS-SIGN': 'your-signature',
        'CB-ACCESS-TIMESTAMP': Date.now().toString(),
        'CB-ACCESS-PASSPHRASE': process.env.COINBASE_API_PASSPHRASE,
      },
    }
  );
  return response.data;
};