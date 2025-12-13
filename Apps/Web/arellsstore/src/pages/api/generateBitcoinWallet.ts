import type { NextApiRequest, NextApiResponse } from 'next';
import { generateBitcoinWallet } from '../../lib/bitcoin-wallet';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const wallet = generateBitcoinWallet();
    res.status(200).json(wallet);
  } catch (error: any) {
    console.error('Error generating Bitcoin wallet:', error);
    res.status(500).json({ error: error.message || 'Failed to generate wallet' });
  }
}

