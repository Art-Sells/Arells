import type { NextApiRequest, NextApiResponse } from 'next';
import { loadWallet } from '../../lib/bitcoin';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address, privateKey } = req.body;
  const wallet = loadWallet(address, privateKey);
  if (wallet) {
    res.status(200).json(wallet);
  } else {
    res.status(400).json({ error: 'Invalid address or private key' });
  }
}