import type { NextApiRequest, NextApiResponse } from 'next';
import KrakenClient from 'kraken-api';

// Log environment variables for debugging purposes
console.log('Kraken API Key:', process.env.NEXT_PUBLIC_KRAKEN_API_KEY);
console.log('Kraken API Secret:', process.env.NEXT_PUBLIC_KRAKEN_API_SECRET);

const kraken = new KrakenClient(
  process.env.NEXT_PUBLIC_KRAKEN_API_KEY!,
  process.env.NEXT_PUBLIC_KRAKEN_API_SECRET!
);

const krakenAPI = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Fetch account balance
    const balance = await kraken.api('Balance');
    console.log('Balance:', balance);

    // Fetch tradable asset pairs
    const assetPairs = await kraken.api('AssetPairs');
    console.log('Asset Pairs:', assetPairs);

    // Place a buy order (buy 0.01 BTC using USD)
    const buyOrder = await kraken.api('AddOrder', {
      pair: 'XBTUSD',
      type: 'buy',
      ordertype: 'market',
      volume: '0.01'
    });
    console.log('Buy Order:', buyOrder);

    // Place a sell order (sell 0.01 BTC using USD)
    const sellOrder = await kraken.api('AddOrder', {
      pair: 'XBTUSD',
      type: 'sell',
      ordertype: 'market',
      volume: '0.01'
    });
    console.log('Sell Order:', sellOrder);

    res.status(200).json({ balance, assetPairs, buyOrder, sellOrder });
  } catch (error) {
    console.error('Error testing Kraken API:', error);

    // Cast the error to any to access its message property
    res.status(500).json({ error: 'Error testing Kraken API', details: (error as any).message });
  }
};

export default krakenAPI;