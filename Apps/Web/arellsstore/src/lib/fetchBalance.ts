/**
 * Fetches Ethereum balances for all wallet addresses in VavityAggregator
 * and updates the wallet data with the latest balances.
 */

interface FetchBalanceParams {
  email: string;
  assetPrice: number;
  fetchVavityAggregator: (email: string) => Promise<any>;
  saveVavityAggregator: (email: string, wallets: any[], vavityCombinations: any) => Promise<any>;
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

    // Fetch balances for wallets with depositPaid=true in parallel
    const balancePromises = walletsToFetch.map(async (wallet: any) => {
      if (!wallet.address) {
        console.log(`[fetchBalance] Skipping wallet without address`);
        return {
          address: null,
          balance: 0,
          vapaa: null,
        };
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
          // Return 0 balance on error instead of null
          return {
            address: wallet.address,
            balance: 0,
            vapaa: vapaa,
          };
        }
        
        const balanceData = await balanceResponse.json();
        const balance = parseFloat(balanceData.balance || '0');
        
        const tokenName = vapaa === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'tokens';
        console.log(`[fetchBalance] Balance fetched for ${wallet.address}: ${balance} ${tokenName} (current: ${wallet.cVactTaa || 0})`);
        
        // Always return the balance, even if it's 0 or unchanged
        return {
          address: wallet.address,
          balance: balance,
          vapaa: vapaa,
        };
      } catch (error: any) {
        console.error(`[fetchBalance] Error fetching balance for ${wallet.address}:`, error);
        // Return 0 balance on error instead of null so we still update the wallet
        return {
          address: wallet.address,
          balance: 0,
          vapaa: vapaa,
        };
      }
    });

    const balanceResults = await Promise.all(balancePromises);
    // Filter out null addresses but keep all balance results
    const balancesToUpdate = balanceResults.filter((b: any) => b !== null && b.address !== null);
    
    console.log(`[fetchBalance] Balance results:`, balanceResults);
    console.log(`[fetchBalance] Balances to update:`, balancesToUpdate);
    
    // Always update wallets, even if balance is 0 or unchanged
    if (wallets.length > 0) {
      console.log(`[fetchBalance] Updating ${wallets.length} wallet(s) with balances`);
      
      // Update wallets with new balances (only for wallets with depositPaid=true)
      const allWallets = wallets.map((wallet: any) => {
        // Only update wallets where depositPaid is true
        if (wallet.depositPaid !== true) {
          return wallet; // Return unchanged if deposit not paid
        }
        const balanceUpdate = balancesToUpdate.find(
          (b: any) => b.address?.toLowerCase() === wallet.address?.toLowerCase() &&
                      b.vapaa?.toLowerCase() === (wallet.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase()
        );
        
        if (balanceUpdate) {
          // Recalculate wallet values based on current balance
          // NOTE: cVactTaa should NOT be updated here - it's a snapshot at connection time (balanceAfterDeposit)
          // cVactTaa = balance at time of connection (after deposit), never changes
          // Only update cVact, cpVact, and cdVatoc based on current balance
          const currentBalance = balanceUpdate.balance;
          const newCpVact = Math.max(wallet.cpVact || 0, assetPrice);
          // Calculate cVact using current balance (not cVactTaa, which is connection-time snapshot)
          const newCVact = currentBalance * newCpVact;
          const newCdVatoc = newCVact - (wallet.cVatoc || 0);
          
          console.log(`[fetchBalance] Updating wallet ${wallet.address} (VAPAA: ${wallet.vapaa || '0x0000...'}): currentBalance=${currentBalance}, cVactTaa=${wallet.cVactTaa} (preserved - connection-time snapshot), cVact=${newCVact.toFixed(2)}`);
          
          // Ensure cpVatoc is set - if it's 0 or missing, set it to current cpVact (VAPA at time of connection)
          // cpVatoc should be the VAPA at time of first connection, so only set if it's missing
          const newCpVatoc = wallet.cpVatoc && wallet.cpVatoc > 0 ? wallet.cpVatoc : newCpVact;
          
          return {
            ...wallet,
            vapaa: wallet.vapaa || '0x0000000000000000000000000000000000000000', // Ensure VAPAA is set
            depositPaid: wallet.depositPaid !== undefined ? wallet.depositPaid : true, // Preserve depositPaid
            cVactTaa: wallet.cVactTaa, // PRESERVE cVactTaa - it's a snapshot at connection time (balanceAfterDeposit), never update it
            cpVact: newCpVact,
            cpVatoc: newCpVatoc, // Ensure cpVatoc is set if it was missing
            cVact: parseFloat(newCVact.toFixed(2)),
            cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
          };
        }
        // If no balance update found, keep wallet as is but ensure it has the right structure
        return {
          ...wallet,
          vapaa: wallet.vapaa || '0x0000000000000000000000000000000000000000', // Ensure VAPAA is set
          depositPaid: wallet.depositPaid !== undefined ? wallet.depositPaid : false, // Preserve depositPaid
        };
      });

      // Save updated wallets back to VavityAggregator
      const vavityCombinations = aggregatorData?.vavityCombinations || {};
      console.log(`[fetchBalance] About to save ${allWallets.length} wallet(s) with updated balances`);
      console.log(`[fetchBalance] Sample wallet data:`, allWallets[0]);
      try {
        const result = await saveVavityAggregator(email, allWallets, vavityCombinations);
        console.log(`[fetchBalance] Save result:`, result);
        console.log(`[fetchBalance] Successfully updated ${balancesToUpdate.length} wallet balance(s) in VavityAggregator`);
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

