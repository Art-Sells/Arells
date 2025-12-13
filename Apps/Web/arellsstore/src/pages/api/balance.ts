import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    // Use blockchain.info API to get balance
    // Returns balance in satoshis
    const response = await axios.get(`https://blockchain.info/q/addressbalance/${address}`);
    
    // The API returns balance in satoshis as a number
    const balanceInSatoshis = parseInt(response.data.toString(), 10);
    
    if (isNaN(balanceInSatoshis)) {
      return res.status(500).json({ error: 'Invalid balance response' });
    }

    res.status(200).json(balanceInSatoshis);
  } catch (error: any) {
    console.error('Error fetching Bitcoin balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
}

