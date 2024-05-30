import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransaction } from '../../lib/bitcoin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { senderPrivateKey, recipientAddress, amount, fee } = req.body;
  try {
    const txHex = await createTransaction(senderPrivateKey, recipientAddress, amount, fee);
    res.status(200).json({ txHex });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}