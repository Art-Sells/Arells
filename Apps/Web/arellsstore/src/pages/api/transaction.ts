import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransaction } from '../../lib/bitcoin';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { senderPrivateKey, recipientAddress, amount, fee } = req.body;

  if (!senderPrivateKey || !recipientAddress || typeof amount !== 'number' || typeof fee !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const txHex = await createTransaction(senderPrivateKey, recipientAddress, amount, fee);

    // Broadcast the transaction
    const broadcastResponse = await axios.post('https://api.blockcypher.com/v1/btc/test3/txs/push', { tx: txHex });
    const txId = broadcastResponse.data.tx.hash;

    res.status(200).json({ txId });
  } catch (error: unknown) {
    console.error('Error in handler:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
}