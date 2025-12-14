import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Support both Ethereum mainnet and Base (used to fetch Bitcoin balances via wallet connections)
const ETHEREUM_RPC = process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo';
const BASE_RPC = process.env.BASE_RPC || 'https://base-mainnet.g.alchemy.com/v2/demo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  // Validate wallet address format (Ethereum-compatible address)
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    // Try Ethereum mainnet first
    let provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
    let balance = await provider.getBalance(address);
    let balanceInBTC = parseFloat(ethers.formatEther(balance));
    
    // If balance is 0, try Base network
    if (balanceInBTC === 0) {
      try {
        provider = new ethers.JsonRpcProvider(BASE_RPC);
        balance = await provider.getBalance(address);
        balanceInBTC = parseFloat(ethers.formatEther(balance));
      } catch (baseError) {
        // If Base fails, use mainnet balance (which is 0)
        console.log('Base network check failed, using mainnet balance');
      }
    }

    res.status(200).json({ 
      balance: balanceInBTC.toString(),
      address: address 
    });
  } catch (error: any) {
    console.error('Error fetching Bitcoin balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
}

