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
  // For native ETH, use zero address
  const NATIVE_ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
  const tokenAddr = tokenAddress || NATIVE_ETH_ADDRESS;
  console.log(`[connectAsset] Fetching balance for address: ${walletAddress}, tokenAddress: ${tokenAddr} (original: ${tokenAddress})`);
  
  let balance: number;
  try {
    // Always pass tokenAddress in URL - use zero address for native ETH
    const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`);
    
    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      console.error(`[connectAsset] Balance API error (${balanceResponse.status}):`, errorText);
      throw new Error(`Failed to fetch wallet balance: ${balanceResponse.status} ${balanceResponse.statusText}. ${errorText}`);
    }
    
    const balanceData = await balanceResponse.json();
    console.log(`[connectAsset] Balance API response:`, balanceData);
    balance = parseFloat(balanceData.balance || '0');
    
    if (isNaN(balance)) {
      throw new Error(`Invalid balance returned from API: ${balanceData.balance}`);
    }

    console.log(`[connectAsset] Balance for ${walletAddress}: ${balance}`);
  } catch (error: any) {
    console.error(`[connectAsset] Error fetching balance:`, error);
    if (error.message && error.message.includes('Failed to fetch wallet balance')) {
      throw error; // Re-throw our formatted error
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
    console.log(`[connectAsset] Wallet ${walletAddress} already has depositPaid=true, skipping deposit transaction`);
    
    // Fetch VAPA for this path (wallet already has depositPaid=true)
    let actualVapaForReconnect: number;
    try {
      const highestPriceResponse = await axios.get('/api/fetchHighestEthereumPrice');
      const highestPriceEver = highestPriceResponse.data?.highestPriceEver || 0;
      actualVapaForReconnect = Math.max(vapa || 0, highestPriceEver || 0, assetPrice || 0);
    } catch (error) {
      console.error('[connectAsset] Error fetching VAPA for reconnect, using fallback:', error);
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
    
    // Return early without deposit transaction
    console.log(`[connectAsset] Wallet reconnected without deposit:`, walletData);
    return { 
      txHash: 'skipped-deposit-already-paid', 
      receipt: null, 
      walletData 
    };
  }

  // Step 3: Calculate deposit amount (0.5% of balance)
  const depositAmount = calculateDepositAmount(balance);
  console.log(`[connectAsset] Deposit amount (0.5%): ${depositAmount}`);

  // Step 4: Send deposit transaction directly (wallet will prompt user)
  // No need for window.confirm - the wallet extension will show the transaction prompt
  console.log(`[connectAsset] Proceeding with deposit transaction. Amount: ${depositAmount.toFixed(6)} ${tokenAddr === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'tokens'}, Address: ${DEPOSIT_ADDRESS}`);

  // Step 5: Send deposit transaction and wait for confirmation
  const { txHash, receipt } = await completeDepositFlow({
    provider,
    walletAddress,
    tokenAddress: tokenAddr === '0x0000000000000000000000000000000000000000' ? undefined : tokenAddr,
    balance,
  });

  console.log(`[connectAsset] Deposit transaction confirmed: ${txHash}`);

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
        console.warn(`[connectAsset] Invalid balance returned from API after deposit: ${balanceDataAfterDeposit.balance}`);
        balanceAfterDeposit = balance;
      } else {
        console.log(`[connectAsset] Balance after deposit for ${walletAddress}: ${balanceAfterDeposit} (was ${balance} before deposit)`);
      }
    }
  } catch (error: any) {
    console.warn(`[connectAsset] Error fetching balance after deposit (non-critical):`, error);
    // Fallback to using the balance before deposit if we can't fetch after
    balanceAfterDeposit = balance;
  }

  // Step 7: ALWAYS fetch fresh VAPA at time of connection (after deposit)
  // This ensures cpVatoc is set to the actual VAPA at connection time, not a stale value
  // Fetch VavityAggregator and VAPA in parallel for speed
  console.log('[connectAsset] Fetching fresh VAPA and VavityAggregator data in parallel...');
  
  // Start fetching both in parallel
  const existingDataPromise = fetchVavityAggregator(email);
  const vapaPromise = Promise.race([
    axios.get('/api/fetchHighestEthereumPrice', { timeout: 2000 }), // 2 second timeout
    new Promise((_, reject) => setTimeout(() => reject(new Error('VAPA fetch timeout')), 2000))
  ]).catch((error) => {
    console.warn('[connectAsset] VAPA fetch failed or timed out:', error.message);
    return null;
  });
  
  // Wait for both (VavityAggregator is required, VAPA is critical for cpVatoc)
  const results = await Promise.allSettled([existingDataPromise, vapaPromise]);
  
  // Extract VavityAggregator data (first result)
  // This is non-critical - if it fails, we'll just create a new wallet entry
  let existingWallets: any[] = [];
  if (results[0].status === 'fulfilled') {
    existingWallets = results[0].value.wallets || [];
  } else {
    console.warn('[connectAsset] Error fetching VavityAggregator (non-critical, will create new wallet):', results[0].reason);
    // If VavityAggregator fetch fails, try to fetch it again
    try {
      const retryData = await fetchVavityAggregator(email);
      existingWallets = retryData.wallets || [];
      console.log('[connectAsset] Retry fetchVavityAggregator succeeded');
    } catch (retryError) {
      console.warn('[connectAsset] Retry fetchVavityAggregator also failed, continuing with empty wallets array (non-critical):', retryError);
    }
  }
  
  // Extract VAPA value - ALWAYS use the maximum of fetched highestPriceEver, passed vapa, and assetPrice
  // This ensures we get the actual VAPA at connection time
  let actualVapa: number;
  let highestPriceEver = 0;
  
  if (results[1].status === 'fulfilled' && results[1].value && results[1].value.data) {
    highestPriceEver = results[1].value.data?.highestPriceEver || 0;
    console.log('[connectAsset] VAPA fetch results (after deposit):', { 
      highestPriceEver, 
      vapa,
      assetPrice,
      fetched: highestPriceEver 
    });
  } else {
    console.warn('[connectAsset] VAPA fetch failed, using fallback values');
  }
  
  // Always use the maximum of: fetched highestPriceEver, passed vapa, and assetPrice
  // This ensures cpVatoc is set to the actual VAPA at connection time
  actualVapa = Math.max(
    highestPriceEver || 0,
    vapa || 0,
    assetPrice || 0
  );
  
  const currentVapa = actualVapa;
  console.log('[connectAsset] Final currentVapa for cpVatoc and cpVact (using max of fetched, vapa param, assetPrice):', {
    currentVapa,
    highestPriceEver,
    vapaParam: vapa,
    assetPrice,
    'usingFetched': highestPriceEver > 0
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

    console.log('[connectAsset] Creating new wallet with:', {
      walletId,
      newCpVatoc,
      newCpVact,
      currentVapa,
      'cpVatoc equals cpVact?': newCpVatoc === newCpVact,
      'cpVatoc equals currentVapa?': newCpVatoc === currentVapa,
      'cpVact equals currentVapa?': newCpVact === currentVapa,
      newCVact,
      newCVatoc,
      balanceAfterDeposit
    });

    walletData = {
      walletId: walletId,
      address: walletAddress,
      vapaa: tokenAddr,
      depositPaid: true, // Mark deposit as paid
      cVatoc: newCVatoc,
      cpVatoc: newCpVatoc,
      cVact: newCVact,
      cpVact: newCpVact,
      cVactTaa: newCVactTaa,
      cdVatoc: newCdVatoc,
    };

    // Add new wallet to VavityAggregator
    await addVavityAggregator(email, [walletData]);
  }

  console.log(`[connectAsset] Wallet connected with depositPaid=true:`, walletData);

  return { txHash, receipt, walletData };
}

