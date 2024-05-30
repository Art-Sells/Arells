import type { NextApiRequest, NextApiResponse } from 'next';
import { getBalance } from '../../lib/bitcoin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  try {
    const balance = await getBalance(address as string);
    res.status(200).json({ balance });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}