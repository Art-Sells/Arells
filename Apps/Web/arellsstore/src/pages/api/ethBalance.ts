import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Support both Ethereum mainnet and Base (used to fetch Ethereum balances via wallet connections)
const ETHEREUM_RPC = process.env.ETHEREUM_RPC_URL || process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo';
const BASE_RPC = process.env.BASE_RPC_URL || process.env.BASE_RPC || 'https://base-mainnet.g.alchemy.com/v2/demo';

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
    console.log(`[ethBalance API] Using ETHEREUM_RPC: ${ETHEREUM_RPC.substring(0, 50)}...`);
    console.log(`[ethBalance API] Using BASE_RPC: ${BASE_RPC.substring(0, 50)}...`);
    console.log(`[ethBalance API] Fetching balance for address: ${address}`);
    
    // Fetch native ETH balance (not ERC-20 tokens)
    // Native ETH doesn't have a token address - it's the wallet's native balance
    // Check both networks in parallel for faster response (max 3 seconds each)
    const fetchBalance = async (rpcUrl: string, networkName: string): Promise<number> => {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        // Use Promise.race with timeout
        const balancePromise = provider.getBalance(address);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout after 3s`)), 3000)
        );
        
        const balance = await Promise.race([balancePromise, timeoutPromise]);
        return parseFloat(ethers.formatEther(balance));
      } catch (error) {
        console.log(`${networkName} balance fetch failed or timed out:`, error);
        return 0;
      }
    };

    // Fetch both networks in parallel
    const [ethereumBalance, baseBalance] = await Promise.all([
      fetchBalance(ETHEREUM_RPC, 'Ethereum'),
      fetchBalance(BASE_RPC, 'Base')
    ]);

    // Use the higher balance (most wallets will have balance on one network)
    const balanceInETH = Math.max(ethereumBalance, baseBalance);
    
    console.log(`[ethBalance API] Ethereum balance: ${ethereumBalance} ETH, Base balance: ${baseBalance} ETH`);
    console.log(`[ethBalance API] Final balance: ${balanceInETH} ETH`);

    res.status(200).json({ 
      balance: balanceInETH.toString(),
      address: address 
    });
  } catch (error: any) {
    console.error('Error fetching Ethereum balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
}

