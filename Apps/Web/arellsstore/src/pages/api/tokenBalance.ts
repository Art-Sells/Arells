import type { NextApiRequest, NextApiResponse } from 'next';
import { ethers } from 'ethers';

// Support both Ethereum mainnet and Base
const ETHEREUM_RPC = process.env.ETHEREUM_RPC_URL || process.env.ETHEREUM_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo';
const BASE_RPC = process.env.BASE_RPC_URL || process.env.BASE_RPC || 'https://base-mainnet.g.alchemy.com/v2/demo';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, tokenAddress } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  // Validate wallet address format
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    // If no tokenAddress or tokenAddress is native ETH (0x0000...), fetch native ETH balance
    const isNativeETH = !tokenAddress || 
                        tokenAddress === '0x0000000000000000000000000000000000000000' ||
                        tokenAddress === 'native' ||
                        tokenAddress === '';

    if (isNativeETH) {
      // Fetch native ETH balance (same logic as ethBalance.ts)
      const fetchBalance = async (rpcUrl: string, networkName: string): Promise<number> => {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const balancePromise = provider.getBalance(address);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after 3s`)), 3000)
          );
          
          const balance = await Promise.race([balancePromise, timeoutPromise]);
          return parseFloat(ethers.formatEther(balance));
        } catch (error) {
          console.log(`[tokenBalance API] ${networkName} balance fetch failed or timed out:`, error);
          return 0;
        }
      };

      const [ethereumBalance, baseBalance] = await Promise.all([
        fetchBalance(ETHEREUM_RPC, 'Ethereum'),
        fetchBalance(BASE_RPC, 'Base')
      ]);

      const balanceInETH = Math.max(ethereumBalance, baseBalance);
      
      console.log(`[tokenBalance API] Native ETH balance for ${address}: ${balanceInETH} ETH`);

      return res.status(200).json({ 
        balance: balanceInETH.toString(),
        address: address,
        tokenAddress: '0x0000000000000000000000000000000000000000', // Native ETH
        isNative: true
      });
    } else {
      // Fetch ERC20 token balance
      if (!ethers.isAddress(tokenAddress as string)) {
        return res.status(400).json({ error: 'Invalid token address' });
      }

      const fetchTokenBalance = async (rpcUrl: string, networkName: string): Promise<number> => {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const tokenContract = new ethers.Contract(tokenAddress as string, ERC20_ABI, provider);
          
          // Get decimals and balance in parallel
          const [balance, decimals] = await Promise.all([
            tokenContract.balanceOf(address),
            tokenContract.decimals()
          ]);

          const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));
          console.log(`[tokenBalance API] ${networkName} token balance for ${address}: ${balanceFormatted}`);
          return balanceFormatted;
        } catch (error) {
          console.log(`[tokenBalance API] ${networkName} token balance fetch failed:`, error);
          return 0;
        }
      };

      // Try both networks - token might exist on either
      const [ethereumBalance, baseBalance] = await Promise.all([
        fetchTokenBalance(ETHEREUM_RPC, 'Ethereum'),
        fetchTokenBalance(BASE_RPC, 'Base')
      ]);

      // Use the higher balance (token will typically exist on one network)
      const balance = Math.max(ethereumBalance, baseBalance);
      
      console.log(`[tokenBalance API] Token ${tokenAddress} balance for ${address}: ${balance}`);

      return res.status(200).json({ 
        balance: balance.toString(),
        address: address,
        tokenAddress: tokenAddress as string,
        isNative: false
      });
    }
  } catch (error: any) {
    console.error('[tokenBalance API] Error fetching token balance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch token balance' });
  }
}

