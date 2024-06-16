import type { NextApiRequest, NextApiResponse } from 'next';
import { generateWallet } from '../../lib/bitcoin';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const wallet = generateWallet();
  res.status(200).json(wallet);
}