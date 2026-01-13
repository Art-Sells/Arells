
/**
 * Fetches Ethereum balances for all wallet addresses in VavityAggregator
 * and updates the wallet data with the latest balances.
 */

import axios from 'axios';

interface FetchBalanceParams {
  email: string;
  assetPrice: number;
  fetchVavityAggregator: (email: string) => Promise<any>;
  saveVavityAggregator: (email: string, wallets: any[], vavityCombinations: any, balances?: any[], globalVapa?: number) => Promise<any>;
  setWalletBalances?: (balances: { [address: string]: number }) => void; // Optional callback to update display-only balances
}

export const fetchBalance = async ({
  email,
  assetPrice,
  fetchVavityAggregator,
  saveVavityAggregator,
  setWalletBalances,
}: FetchBalanceParams): Promise<void> => {
  if (!email) {
    return;
  }

  try {
    // Fetch all wallets from VavityAggregator
    const aggregatorData = await fetchVavityAggregator(email);
    const wallets = aggregatorData?.wallets || [];
    
    if (wallets.length === 0) {
      return;
    }

    // Filter wallets to only fetch balances for those where depositPaid is true
    const walletsToFetch = wallets.filter((wallet: any) => {
      return wallet.depositPaid === true;
    });

    if (walletsToFetch.length === 0) {
      return;
    }

    // Fetch global VAPA once (used for backend calculations)
    let globalVapa = assetPrice; // Fallback to assetPrice
    try {
      const vapaResponse = await axios.get('/api/vapa');
      globalVapa = vapaResponse.data?.vapa || assetPrice;
    } catch (error) {
      // Use fallback assetPrice
    }
    
    // Note: VAPA will be passed to backend for cpVact calculations

    // Fetch balances for wallets with depositPaid=true in parallel
    const balancePromises = walletsToFetch.map(async (wallet: any) => {
      if (!wallet.address) {
        return null;
      }
      
      // Get VAPAA (token address) from wallet, default to native ETH
      const vapaa = wallet.vapaa || '0x0000000000000000000000000000000000000000';
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const balanceResponse = await fetch(`/api/tokenBalance?address=${wallet.address}&tokenAddress=${vapaa}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!balanceResponse.ok) {
          return null;
        }
        
        const balanceData = await balanceResponse.json();
        if (!balanceData.balance || balanceData.balance === null || balanceData.balance === undefined) {
          return null;
        }
        const balance = parseFloat(balanceData.balance);
        if (isNaN(balance)) {
          return null;
        }
        
        // Always return the balance, even if it's 0 or unchanged
        return {
          address: wallet.address,
          balance: balance,
          vapaa: vapaa,
        };
      } catch (error: any) {
        return null;
      }
    });

    const balanceResults = await Promise.all(balancePromises);
    // Filter out null results (errors, missing balances, etc.)
    const balancesToUpdate = balanceResults.filter((b: any) => b !== null && b.address !== null && b.balance !== null);
    
    // Update temporary display-only balances (never stored in wallet objects)
    if (setWalletBalances) {
      const balanceMap: { [address: string]: number } = {};
      balancesToUpdate.forEach((b: any) => {
        if (b.address && b.balance !== null && b.balance !== undefined) {
          balanceMap[b.address.toLowerCase()] = b.balance;
        }
      });
      setWalletBalances(balanceMap);
    }
    
    // Pass wallets and balances to backend - backend will do all calculations
    if (wallets.length > 0 && balancesToUpdate.length > 0) {
      try {
        await saveVavityAggregator(email, wallets, {}, balancesToUpdate, globalVapa);
      } catch (saveError) {
        throw saveError;
      }
    }
  } catch (error) {
    // Silent error handling
  }
};


