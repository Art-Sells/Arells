import type { NextApiRequest, NextApiResponse } from 'next';
import { getBalance } from '../../lib/bitcoin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  try {
    if (typeof address !== 'string') {
      throw new Error('Invalid address');
    }
    const balance = await getBalance(address);
    res.status(200).json(balance);
  } catch (error) {
    console.error('Error fetching balance:', error);

    // Type guard to check if error is an instance of Error
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}