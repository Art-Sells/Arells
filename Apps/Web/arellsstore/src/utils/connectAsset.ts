import { ethers } from 'ethers';
import { completeDepositFlow, calculateDepositAmount } from './depositTransaction';
import axios from 'axios';

const DEPOSIT_ADDRESS = '0x3DfA7Ea24570148a6B4A3FADC5DFE373b1ecD70B';

export interface ConnectAssetParams {
  provider: any; // Web3 provider from wallet
  walletAddress: string;
  tokenAddress?: string; // If undefined, use native ETH
  email: string;
  assetPrice: number;
  vapa: number;
  addVavityAggregator: (email: string, wallets: any[]) => Promise<any>;
  fetchVavityAggregator: (email: string) => Promise<any>;
  saveVavityAggregator: (email: string, wallets: any[], vavityCombinations: any) => Promise<any>;
}

/**
 * Connect Asset: Handles deposit payment and then fetches wallet balances
 * This is called after user agrees to pay the 0.5% deposit
 */
export async function connectAsset(params: ConnectAssetParams): Promise<{
  txHash: string;
  receipt: ethers.ContractTransactionReceipt | null;
  walletData: any;
}> {
  const { provider, walletAddress, tokenAddress, email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator } = params;

  // Step 1: Fetch current balance
  const NATIVE_ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
  const tokenAddr = tokenAddress || NATIVE_ETH_ADDRESS;
  
  let balance: number;
  try {
    const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`);
    
    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      throw new Error(`Failed to fetch wallet balance: ${balanceResponse.status} ${balanceResponse.statusText}. ${errorText}`);
    }
    
    const balanceData = await balanceResponse.json();
    balance = parseFloat(balanceData.balance || '0');
    
    if (isNaN(balance)) {
      throw new Error(`Invalid balance returned from API: ${balanceData.balance}`);
    }
  } catch (error: any) {
    console.error(`[connectAsset] Error fetching balance:`, error);
    if (error.message && error.message.includes('Failed to fetch wallet balance')) {
      throw error;
    }
    throw new Error(`Failed to fetch wallet balance: ${error.message || error}`);
  }

  // Step 2: Check if wallet already exists with depositPaid = true BEFORE sending deposit
  const existingDataBeforeDeposit = await fetchVavityAggregator(email);
  const existingWalletsBeforeDeposit = existingDataBeforeDeposit.wallets || [];
  const existingWalletBeforeDeposit = existingWalletsBeforeDeposit.find(
    (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase() &&
                (w.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === tokenAddr.toLowerCase() &&
                w.depositPaid === true
  );

  // If wallet already has depositPaid = true, skip deposit and just update balance
  if (existingWalletBeforeDeposit) {
    // Fetch VAPA for this path (wallet already has depositPaid=true)
    let actualVapaForReconnect: number;
    try {
      const highestPriceResponse = await axios.get('/api/fetchHighestEthereumPrice');
      const highestPriceEver = highestPriceResponse.data?.highestPriceEver || 0;
      actualVapaForReconnect = Math.max(vapa || 0, highestPriceEver || 0, assetPrice || 0);
    } catch (error) {
      actualVapaForReconnect = Math.max(vapa || 0, assetPrice || 0);
    }
    const currentVapaForReconnect = actualVapaForReconnect;
    
    const newCVactTaa = balance; // Use balance before deposit (no deposit was sent)
    const newCpVact = Math.max(existingWalletBeforeDeposit.cpVact || 0, currentVapaForReconnect);
    const newCVact = newCVactTaa * newCpVact;
    const newCdVatoc = newCVact - (existingWalletBeforeDeposit.cVatoc || 0);
    
    // Update cpVatoc if it's 0 or if it's significantly different from current VAPA (was set incorrectly)
    // cpVatoc should be the VAPA at time of first connection, so only update if it's clearly wrong (0 or way off)
    const shouldUpdateCpVatoc = !existingWalletBeforeDeposit.cpVatoc || existingWalletBeforeDeposit.cpVatoc === 0;
    const newCpVatoc = shouldUpdateCpVatoc ? currentVapaForReconnect : existingWalletBeforeDeposit.cpVatoc;

    const walletData = {
      ...existingWalletBeforeDeposit,
      depositPaid: true, // Keep depositPaid as true
      cVactTaa: newCVactTaa,
      cpVact: newCpVact,
      cpVatoc: newCpVatoc, // Update if it was 0 or missing
      cVact: parseFloat(newCVact.toFixed(2)),
      cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
    };

    // Update the wallet in the array
    const updatedWallets = existingWalletsBeforeDeposit.map((w: any) => 
      w.walletId === existingWalletBeforeDeposit.walletId ? walletData : w
    );

    // Recalculate vavityCombinations
    const vavityCombinations = existingDataBeforeDeposit.vavityCombinations || {};
    await saveVavityAggregator(email, updatedWallets, vavityCombinations);
    
    return { 
      txHash: 'skipped-deposit-already-paid', 
      receipt: null, 
      walletData 
    };
  }

  // Step 3: Calculate deposit amount (0.5% of balance)
  const depositAmount = calculateDepositAmount(balance);

  // Step 4: Send deposit transaction and wait for confirmation
  const { txHash, receipt } = await completeDepositFlow({
    provider,
    walletAddress,
    tokenAddress: tokenAddr === '0x0000000000000000000000000000000000000000' ? undefined : tokenAddr,
    balance,
  });

  // Step 6: Fetch balance again AFTER deposit to get the actual current balance
  // This is non-critical - if it fails, we'll use the balance before deposit
  let balanceAfterDeposit: number;
  try {
    const balanceResponseAfterDeposit = await fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`);
    
    if (!balanceResponseAfterDeposit.ok) {
      const errorText = await balanceResponseAfterDeposit.text();
      console.warn(`[connectAsset] Balance API error after deposit (${balanceResponseAfterDeposit.status}):`, errorText);
      // Don't throw - use fallback instead
      balanceAfterDeposit = balance;
    } else {
      const balanceDataAfterDeposit = await balanceResponseAfterDeposit.json();
      balanceAfterDeposit = parseFloat(balanceDataAfterDeposit.balance || '0');
      
        if (isNaN(balanceAfterDeposit)) {
          balanceAfterDeposit = balance;
        }
      }
    } catch (error: any) {
      balanceAfterDeposit = balance;
    }

  // Step 7: ALWAYS fetch fresh VAPA at time of connection (after deposit)
  // Add a small delay to ensure price APIs have the latest data
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Fetch VavityAggregator, highest price ever, and current price in parallel
  // CRITICAL: Fetch current price FRESH at connection time to ensure cpVatoc matches what cpVact will use
  const existingDataPromise = fetchVavityAggregator(email);
  const highestPricePromise = Promise.race([
    axios.get('/api/fetchHighestEthereumPrice', { timeout: 2000 }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('VAPA fetch timeout')), 2000))
  ]).catch(() => null);
  const currentPricePromise = Promise.race([
    axios.get('/api/fetchEthereumPrice', { timeout: 2000 }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Current price fetch timeout')), 2000))
  ]).catch(() => null);
  
  // Wait for all (VavityAggregator is required, prices are critical for cpVatoc)
  const results = await Promise.allSettled([existingDataPromise, highestPricePromise, currentPricePromise]);
  
  // Extract VavityAggregator data (first result)
  let existingWallets: any[] = [];
  let existingData: any = null;
  if (results[0].status === 'fulfilled') {
    existingData = results[0].value;
    existingWallets = existingData.wallets || [];
  } else {
    try {
      const retryData = await fetchVavityAggregator(email);
      existingData = retryData;
      existingWallets = existingData.wallets || [];
    } catch (retryError) {
      // Continue with empty wallets array
      existingData = { wallets: [], vavityCombinations: {} };
    }
  }
  
  // Extract VAPA value - ALWAYS use the maximum of fetched highestPriceEver, fetched currentPrice, passed vapa, and assetPrice
  // This ensures we get the actual VAPA at connection time
  let actualVapa: number;
  let highestPriceEver = 0;
  let fetchedCurrentPrice = 0;
  
  // Extract highest price ever
  if (results[1] && results[1].status === 'fulfilled' && results[1].value && results[1].value.data) {
    highestPriceEver = results[1].value.data?.highestPriceEver || 0;
  } else {
    try {
      const fallbackVapaResponse = await axios.get('/api/fetchHighestEthereumPrice', { timeout: 2000 });
      highestPriceEver = fallbackVapaResponse.data?.highestPriceEver || 0;
    } catch (fallbackError) {
      // Continue with 0
    }
  }
  
  // Extract current price
  if (results[2] && results[2].status === 'fulfilled' && results[2].value && results[2].value.data) {
    fetchedCurrentPrice = results[2].value.data?.ethereum?.usd || 0;
  } else {
    try {
      const fallbackCurrentPriceResponse = await axios.get('/api/fetchEthereumPrice', { timeout: 2000 });
      fetchedCurrentPrice = fallbackCurrentPriceResponse.data?.ethereum?.usd || 0;
    } catch (fallbackError) {
      // Continue with 0
    }
  }
  
  // VAPA calculation: Use assetPrice as PRIMARY source (same as fetchBalance uses)
  // fetchBalance uses: Math.max(wallet.cpVact || 0, assetPrice)
  // Since cpVact ALWAYS correctly gets VAPA, we should use the SAME source: assetPrice
  // Priority: assetPrice (from context, same as fetchBalance) > fetchedCurrentPrice > highestPriceEver > vapa
  // This ensures cpVatoc uses the exact same source that cpVact uses, so they match
  actualVapa = Math.max(
    assetPrice || 0,           // Primary: SAME source as fetchBalance uses (this is why cpVact is always correct)
    fetchedCurrentPrice || 0,  // Secondary: fetched current price (backup)
    highestPriceEver || 0,     // Tertiary: highest price ever (backup)
    vapa || 0                   // Quaternary: vapa from context (backup)
  );
  
  const currentVapa = actualVapa;
  
  // CRITICAL LOG: Only log VAPA calculation for debugging cpVatoc issue
  console.log('[connectAsset] VAPA for cpVatoc:', {
    assetPriceParam: assetPrice,      // Primary: SAME source as fetchBalance uses (why cpVact is always correct)
    fetchedCurrentPrice,               // Secondary: fetched current price
    highestPriceEver,                  // Tertiary: highest price ever
    vapaParam: vapa,                   // Quaternary: vapa from context
    finalVapa: currentVapa,
    walletAddress,
    'NOTE': 'Using assetPrice as primary to match fetchBalance calculation (same source = same result)'
  });

  // Step 8: Check if wallet already exists in VavityAggregator (for wallets that don't have depositPaid yet)
  const existingWallet = existingWallets.find(
    (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase() &&
                (w.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === tokenAddr.toLowerCase()
  );

  let walletData: any;

  if (existingWallet) {
    // Wallet exists but depositPaid is false, proceed with deposit
    // Update existing wallet: set depositPaid to true and update balance
    // Use balance AFTER deposit for accurate calculations
    const newCVactTaa = balanceAfterDeposit;
    const newCpVact = Math.max(existingWallet.cpVact || 0, currentVapa);
    const newCVact = newCVactTaa * newCpVact;
    const newCdVatoc = newCVact - (existingWallet.cVatoc || 0);
    
    // Update cpVatoc if it's 0 or missing (should be VAPA at time of first connection)
    const shouldUpdateCpVatoc = !existingWallet.cpVatoc || existingWallet.cpVatoc === 0;
    const newCpVatoc = shouldUpdateCpVatoc ? currentVapa : existingWallet.cpVatoc;

    walletData = {
      ...existingWallet,
      depositPaid: true, // Mark deposit as paid
      cVactTaa: newCVactTaa,
      cpVact: newCpVact,
      cpVatoc: newCpVatoc, // Update if it was 0 or missing
      cVact: parseFloat(newCVact.toFixed(2)),
      cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
    };

    // Update the wallet in the array
    const updatedWallets = existingWallets.map((w: any) => 
      w.walletId === existingWallet.walletId ? walletData : w
    );

    // Recalculate vavityCombinations
    const vavityCombinations = existingData.vavityCombinations || {};
    await saveVavityAggregator(email, updatedWallets, vavityCombinations);
  } else {
    // Create new wallet with depositPaid = true
    // Use balance AFTER deposit for accurate calculations
    const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCVactTaa = balanceAfterDeposit;
    const newCpVact = currentVapa;
    const newCVact = newCVactTaa * newCpVact;
    const newCVatoc = newCVact; // cVatoc should equal cVact at connection time (after deposit)
    const newCpVatoc = currentVapa; // cpVatoc should always be VAPA at time of connection
    const newCdVatoc = newCVact - newCVatoc; // Should be 0 at connection time

    // Ensure cpVatoc is set to currentVapa (VAPA at connection time)
    const finalCpVatoc = currentVapa; // Always use currentVapa for new wallets
    const finalCpVact = currentVapa; // cpVact should also be currentVapa for new wallets
    
    // Recalculate cVact using finalCpVact to ensure consistency
    const recalculatedCVact = newCVactTaa * finalCpVact;
    const recalculatedCVatoc = recalculatedCVact; // Should be the same
    
    walletData = {
      walletId: walletId,
      address: walletAddress,
      vapaa: tokenAddr,
      depositPaid: true,
      cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
      cpVatoc: finalCpVatoc, // Always set to currentVapa (VAPA at connection time)
      cVact: parseFloat(recalculatedCVact.toFixed(2)),
      cpVact: finalCpVact,
      cVactTaa: newCVactTaa,
      cdVatoc: parseFloat((recalculatedCVact - recalculatedCVatoc).toFixed(2)),
    };
    
    // CRITICAL LOG: Only log if cpVatoc doesn't match VAPA
    if (finalCpVatoc !== currentVapa) {
      console.error('[connectAsset] ERROR: cpVatoc does not equal currentVapa!', {
        cpVatoc: finalCpVatoc,
        currentVapa,
        difference: Math.abs(finalCpVatoc - currentVapa),
        walletAddress
      });
    }

    // Add new wallet to VavityAggregator
    try {
      await addVavityAggregator(email, [walletData]);
    } catch (error: any) {
      console.error('[connectAsset] Error adding wallet to VavityAggregator:', error);
      throw new Error(`Failed to add wallet to VavityAggregator: ${error?.message || error}`);
    }
  }

  return { txHash, receipt, walletData };
}

