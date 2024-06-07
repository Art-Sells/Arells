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
      console.log(`Amount too low: ${amount}. Minimum amount is ${minAmount}`);
      return res.status(400).json({ error: `Amount is too low. Minimum amount is ${minAmount} satoshis (0.0001 BTC).` });
    }

    // Log the received values
    console.log(`Sender Private Key: ${senderPrivateKey}`);
    console.log(`Recipient Address: ${recipientAddress}`);
    console.log(`Amount in Satoshis: ${amount}`);
    console.log(`Fee in Satoshis: ${fee}`);

    // Create the transaction
    const txHex = await createTransaction(senderPrivateKey, recipientAddress, amount, fee);

    // Log the transaction hex
    console.log(`Transaction Hex: ${txHex}`);

    // Broadcast the transaction
    const broadcastResponse = await axios.post('https://blockchain.info/pushtx', `tx=${txHex}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Log the broadcast response
    console.log(`Broadcast Response: ${JSON.stringify(broadcastResponse.data)}`);

    res.status(200).json({ txId: broadcastResponse.data });
  } catch (error) {
    console.error('Error in handler:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}