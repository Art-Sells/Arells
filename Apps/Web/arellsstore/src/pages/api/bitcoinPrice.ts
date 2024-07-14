import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchBitcoinPrice } from '../../lib/coingecko-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const price = await fetchBitcoinPrice();
      res.status(200).json({ price });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch Bitcoin price' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}