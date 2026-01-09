
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
}

export const fetchBalance = async ({
  email,
  assetPrice,
  fetchVavityAggregator,
  saveVavityAggregator,
}: FetchBalanceParams): Promise<void> => {
  if (!email) {
    console.log('[fetchBalance] No email provided, skipping');
    return;
  }

  try {
    // Fetch all wallets from VavityAggregator
    const aggregatorData = await fetchVavityAggregator(email);
    const wallets = aggregatorData?.wallets || [];
    
    if (wallets.length === 0) {
      console.log('[fetchBalance] No wallets found');
      return;
    }

    console.log(`[fetchBalance] Fetching balances for ${wallets.length} wallet(s)`);

    // Filter wallets to only fetch balances for those where depositPaid is true
    const walletsToFetch = wallets.filter((wallet: any) => {
      const depositPaid = wallet.depositPaid === true;
      if (!depositPaid) {
        console.log(`[fetchBalance] Skipping wallet ${wallet.address} - deposit not paid (depositPaid: ${wallet.depositPaid})`);
      }
      return depositPaid;
    });

    if (walletsToFetch.length === 0) {
      console.log('[fetchBalance] No wallets with depositPaid=true, skipping balance fetch');
      return;
    }

    console.log(`[fetchBalance] Fetching balances for ${walletsToFetch.length} wallet(s) with depositPaid=true`);

    // Fetch global VAPA once (used for backend calculations)
    let globalVapa = assetPrice; // Fallback to assetPrice
    try {
      const vapaResponse = await axios.get('/api/vapa');
      globalVapa = vapaResponse.data?.vapa || assetPrice;
      console.log(`[fetchBalance] Global VAPA: ${globalVapa}`);
    } catch (error) {
      console.warn('[fetchBalance] Error fetching global VAPA, using assetPrice:', error);
    }
    
    // Note: VAPA will be passed to backend for cpVact calculations

    // Fetch balances for wallets with depositPaid=true in parallel
    const balancePromises = walletsToFetch.map(async (wallet: any) => {
      if (!wallet.address) {
        console.log(`[fetchBalance] Skipping wallet without address`);
        return null;
      }
      
      // Get VAPAA (token address) from wallet, default to native ETH
      const vapaa = wallet.vapaa || '0x0000000000000000000000000000000000000000';
      
      try {
        console.log(`[fetchBalance] Fetching balance for ${wallet.address} (VAPAA: ${vapaa})...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const balanceResponse = await fetch(`/api/tokenBalance?address=${wallet.address}&tokenAddress=${vapaa}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!balanceResponse.ok) {
          const errorText = await balanceResponse.text();
          console.error(`[fetchBalance] API error for ${wallet.address}: ${balanceResponse.status} - ${errorText}`);
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
        
        const tokenName = vapaa === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'tokens';
        console.log(`[fetchBalance] Balance fetched for ${wallet.address}: ${balance} ${tokenName} (current: ${wallet.cVactTaa ?? 0})`);
        
        // Always return the balance, even if it's 0 or unchanged
        return {
          address: wallet.address,
          balance: balance,
          vapaa: vapaa,
        };
      } catch (error: any) {
        console.error(`[fetchBalance] Error fetching balance for ${wallet.address}:`, error);
        return null;
      }
    });

    const balanceResults = await Promise.all(balancePromises);
    // Filter out null results (errors, missing balances, etc.)
    const balancesToUpdate = balanceResults.filter((b: any) => b !== null && b.address !== null && b.balance !== null);
    
    console.log(`[fetchBalance] Balance results:`, balanceResults);
    console.log(`[fetchBalance] Balances to update:`, balancesToUpdate);
    
    // Pass wallets and balances to backend - backend will do all calculations
    if (wallets.length > 0 && balancesToUpdate.length > 0) {
      console.log(`[fetchBalance] Passing ${wallets.length} wallet(s) and ${balancesToUpdate.length} balance(s) to backend for calculation`);
      try {
        const result = await saveVavityAggregator(email, wallets, {}, balancesToUpdate, globalVapa);
        console.log(`[fetchBalance] Backend processed wallets and balances successfully`);
      } catch (saveError) {
        console.error(`[fetchBalance] Error saving wallets:`, saveError);
        throw saveError;
      }
    } else {
      console.log(`[fetchBalance] No balances to update and no wallets found`);
    }
  } catch (error) {
    console.error('[fetchBalance] Error fetching wallet balances:', error);
  }
};


