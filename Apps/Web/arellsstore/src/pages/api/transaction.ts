import type { NextApiRequest, NextApiResponse } from 'next';
import { createTransaction } from '../../lib/bitcoin';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { senderPrivateKey, recipientAddress, amount, fee } = req.body;

  try {
    if (!senderPrivateKey || !recipientAddress || amount === undefined || fee === undefined) {
      throw new Error('Missing required fields');
    }

    // Define the minimum amount in satoshis (0.0001 BTC)
    const minAmount = 10000; // Minimum amount in satoshis

    // Ensure amount is not below the minimum amount
    if (amount < minAmount) {
      return res.status(400).json({ error: `Amount is too low. Minimum amount is ${minAmount} satoshis (0.0001 BTC).` });
    }

    const { txHex, txId } = await createTransaction(senderPrivateKey, recipientAddress, amount, fee);

    // Broadcast the transaction
    const broadcastResponse = await axios.post('https://blockchain.info/pushtx', `tx=${txHex}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Check if broadcast was successful
    if (broadcastResponse.status !== 200 || broadcastResponse.data.error) {
      throw new Error(broadcastResponse.data.error || 'Failed to broadcast transaction');
    }

    const txUrl = `https://blockchain.info/tx/${txId}`;

    res.status(200).json({ txId, txUrl });
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}