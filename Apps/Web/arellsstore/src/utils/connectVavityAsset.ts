import { ethers } from 'ethers';
import { completeDepositFlow, calculateDepositAmount, sendDepositTransaction, waitForTransactionConfirmation } from './depositTransaction';
import axios from 'axios';

const DEPOSIT_ADDRESS = '0x3DfA7Ea24570148a6B4A3FADC5DFE373b1ecD70B';

export interface ConnectVavityAssetParams {
  provider: any; // Web3 provider from wallet
  walletAddress: string;
  tokenAddress?: string; // If undefined, use native ETH
  email: string;
  assetPrice: number;
  vapa: number;
  addVavityAggregator: (email: string, wallets: any[]) => Promise<any>;
  fetchVavityAggregator: (email: string) => Promise<any>;
  saveVavityAggregator: (email: string, wallets: any[], vavityCombinations: any) => Promise<any>;
  walletId?: string; // Optional walletId for saving txHash
  walletType?: 'metamask' | 'base'; // Optional walletType for saving txHash
}

/**
 * Connect Vavity Asset: Handles deposit payment and then fetches wallet balances
 * This is called after user agrees to pay the 0.5% deposit
 */
export async function connectVavityAsset(params: ConnectVavityAssetParams): Promise<{
  txHash: string;
  receipt: ethers.ContractTransactionReceipt | null;
  walletData: any;
}> {
  const { provider, walletAddress, tokenAddress, email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator } = params;

  // Step 1 & 2: Fetch balance and check wallet existence in parallel for faster response
  const NATIVE_ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
  const tokenAddr = tokenAddress || NATIVE_ETH_ADDRESS;
  
  // Fetch both in parallel with aggressive timeouts to speed up the deposit prompt
  const [balanceResult, walletCheckResult] = await Promise.allSettled([
    // Balance fetch with 2 second timeout
    Promise.race([
      fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Balance fetch timeout')), 2000))
    ]),
    // Wallet check with 1.5 second timeout (can be slower, we'll continue if it fails)
    Promise.race([
      fetchVavityAggregator(email),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Wallet check timeout')), 1500))
    ])
  ]);
  
  // Process balance result (required)
  let balance: number;
  if (balanceResult.status === 'fulfilled') {
    const balanceResponse = balanceResult.value;
    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      throw new Error(`Failed to fetch wallet balance: ${balanceResponse.status} ${balanceResponse.statusText}. ${errorText}`);
    }
    const balanceData = await balanceResponse.json();
    balance = parseFloat(balanceData.balance || '0');
    
    if (isNaN(balance)) {
      throw new Error(`Invalid balance returned from API: ${balanceData.balance}`);
    }
  } else {
    // Balance fetch failed or timed out - try once more without timeout
      console.warn('[connectVavityAsset] Balance fetch timed out or failed, retrying...');
    const retryResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`);
    if (!retryResponse.ok) {
      const errorText = await retryResponse.text();
      throw new Error(`Failed to fetch wallet balance: ${retryResponse.status} ${retryResponse.statusText}. ${errorText}`);
    }
    const balanceData = await retryResponse.json();
    balance = parseFloat(balanceData.balance || '0');
    
    if (isNaN(balance)) {
      throw new Error(`Invalid balance returned from API: ${balanceData.balance}`);
    }
  }

  // Process wallet check result (optional - continue if it fails)
  let existingWalletBeforeDeposit: any = null;
  if (walletCheckResult.status === 'fulfilled') {
    try {
      const existingDataBeforeDeposit = walletCheckResult.value;
      const existingWalletsBeforeDeposit = existingDataBeforeDeposit.wallets || [];
      existingWalletBeforeDeposit = existingWalletsBeforeDeposit.find(
        (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase() &&
                    (w.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === tokenAddr.toLowerCase() &&
                    w.depositPaid === true
      );
    } catch (error) {
      console.warn('[connectAsset] Error processing wallet check result, continuing:', error);
    }
  } else {
    // Wallet check failed or timed out - continue anyway, we'll check again after deposit
      console.warn('[connectVavityAsset] Wallet existence check failed or timed out, continuing with deposit flow');
  }

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

  // Step 4: Send deposit transaction and get txHash immediately
  // Return txHash right away, then continue processing in background
  let txHash: string;
  try {
    txHash = await sendDepositTransaction({
      provider,
      walletAddress,
      tokenAddress: tokenAddr === '0x0000000000000000000000000000000000000000' ? undefined : tokenAddr,
      balance,
    });
  } catch (error: any) {
    // Check if this is a cancellation error from sendDepositTransaction
    if (error?.isCancelled === true || error?.code === 4001) {
      console.log('[connectVavityAsset] User cancelled deposit transaction - re-throwing with cancellation flag');
      // Re-throw with cancellation flag so it can be caught upstream
      const cancellationError: any = new Error('User rejected the deposit transaction');
      cancellationError.code = 4001;
      cancellationError.isCancelled = true;
      throw cancellationError;
    }
    // Re-throw other errors as-is
    throw error;
  }
  
  // CRITICAL: Save txHash to backend JSON immediately (before waiting for confirmation)
  // This allows processPendingWallet to detect pending transactions after page reload
  // NOTE: This only UPDATES the JSON file - it does NOT create it
  // The JSON file should be created when buttons are clicked (in VavityTester.tsx)
  try {
    // Try to find existing vavity connection for this address
    const vavityResponse = await axios.get('/api/saveVavityConnection', { params: { email } });
    const existingConnections = vavityResponse.data.vavityConnections || [];
    const matchingConnection = existingConnections.find(
      (vc: any) => vc.address?.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (matchingConnection) {
      // Update existing connection with txHash
      // Preserve all boolean states
      await axios.post('/api/saveVavityConnection', {
        email,
        vavityConnection: {
          ...matchingConnection,
          txHash: txHash,
          // Preserve assetConnected state from matchingConnection
          assetConnected: matchingConnection.assetConnected ?? false,
        },
      });
      console.log('[connectVavityAsset] Saved txHash to existing vavity connection:', txHash);
    } else if (params.walletId && params.walletType) {
      // If no matching connection found but we have walletId and walletType, update/create one
      // NOTE: JSON file should already exist (created when button was clicked)
      // If it doesn't exist, this will create it, but it shouldn't happen
      console.warn('[connectVavityAsset] No matching connection found - JSON file should have been created when button was clicked');
      await axios.post('/api/saveVavityConnection', {
        email,
        vavityConnection: {
          address: walletAddress,
          walletId: params.walletId,
          walletType: params.walletType,
          timestamp: Date.now(),
          // Deposit in progress
          assetConnected: false,
          txHash: txHash,
        },
      });
      console.log('[connectVavityAsset] Created/updated vavity connection with txHash:', txHash);
    }
  } catch (error) {
      console.error('[connectVavityAsset] Error saving txHash to backend (non-critical):', error);
    // Continue anyway - not critical, processPendingWallet will check blockchain
  }
  
  // Return immediately after transaction is sent - don't wait for confirmation
  // This allows the UI to update quickly while confirmation happens in background
  const walletId = params.walletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const walletData = {
    walletId: walletId,
    address: walletAddress,
    vapaa: tokenAddr,
    depositPaid: false, // Will be updated after confirmation
  };

  // CRITICAL: Try to create wallet immediately (synchronously) with basic data
  // This ensures wallet exists even if background process fails
  (async () => {
    try {
      console.log('[connectVavityAsset] Creating wallet immediately (synchronous fallback)...');
      // Fetch VAPA for immediate wallet creation
      let immediateVapa = Math.max(vapa || 0, assetPrice || 0);
      try {
        const vapaResponse = await axios.get('/api/vapa', { timeout: 2000 });
        immediateVapa = Math.max(immediateVapa, vapaResponse.data?.vapa || 0);
      } catch (vapaError) {
        // Use fallback VAPA if fetch fails
        console.warn('[connectVavityAsset] Could not fetch VAPA for immediate creation, using fallback:', immediateVapa);
      }
      
      const immediateWalletData = {
        walletId: walletId,
        address: walletAddress,
        vapaa: tokenAddr,
        depositPaid: true, // Mark as paid since transaction was sent
        cVatoc: parseFloat((balance * immediateVapa).toFixed(2)),
        cpVatoc: immediateVapa,
        cVact: parseFloat((balance * immediateVapa).toFixed(2)),
        cpVact: immediateVapa,
        cVactTaa: balance,
        cdVatoc: 0,
      };
      await addVavityAggregator(email, [immediateWalletData]);
      console.log('[connectVavityAsset] Immediate wallet creation successful');
    } catch (immediateError: any) {
      // If duplicate, that's fine - wallet might already exist
      if (immediateError?.response?.data?.error?.includes('duplicate') || 
          immediateError?.response?.data?.message?.includes('already exist')) {
        console.log('[connectVavityAsset] Wallet already exists (immediate creation), will update in background');
      } else {
        console.error('[connectVavityAsset] Immediate wallet creation failed (non-critical, background will retry):', immediateError);
      }
    }
  })();

  // Continue confirmation and wallet updates in the background (non-blocking)
  (async () => {
    try {
      console.log('[connectVavityAsset] ===== BACKGROUND PROCESS STARTED =====', {
        txHash,
        walletAddress,
        email,
        tokenAddr,
      });
      // Wait for confirmation in background
      const receipt = await waitForTransactionConfirmation(provider, txHash);
      console.log('[connectVavityAsset] Transaction confirmed in background:', txHash);

      // Step 6: Fetch balance again AFTER deposit to get the actual current balance
      // This is non-critical - if it fails, we'll use the balance before deposit
      let balanceAfterDeposit: number;
      try {
        const balanceResponseAfterDeposit = await fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`);
        
        if (!balanceResponseAfterDeposit.ok) {
          const errorText = await balanceResponseAfterDeposit.text();
          console.warn(`[connectVavityAsset] Balance API error after deposit (${balanceResponseAfterDeposit.status}):`, errorText);
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
      
      // Get VAPA from global /api/vapa endpoint (persistent VAPA that never decreases)
      // This is the PRIMARY and ONLY source for VAPA - it's the single source of truth
      let globalVapa = 0;
      try {
        const vapaResponse = await axios.get('/api/vapa');
        globalVapa = vapaResponse.data?.vapa || 0;
      } catch (error) {
        console.error('[connectVavityAsset] Error fetching global VAPA, using fallback:', error);
        // Fallback: use highest of other sources
        globalVapa = Math.max(
          assetPrice || 0,
          fetchedCurrentPrice || 0,
          highestPriceEver || 0,
          vapa || 0
        );
      }
      
      // VAPA calculation: ALWAYS use global VAPA as PRIMARY source
      // If global VAPA exists, use it. Otherwise, calculate from other sources and save to global
      if (globalVapa > 0) {
        actualVapa = globalVapa; // Use global VAPA (single source of truth)
      } else {
        // Global VAPA doesn't exist yet - calculate from sources
      actualVapa = Math.max(
          assetPrice || 0,
          fetchedCurrentPrice || 0,
          highestPriceEver || 0,
          vapa || 0
        );
        // Save calculated VAPA to global endpoint
        try {
          await axios.post('/api/vapa', { vapa: actualVapa });
        } catch (error) {
          console.error('[connectVavityAsset] Error saving calculated VAPA to global:', error);
        }
      }
      
      const currentVapa = actualVapa;
      
      // Save VAPA to global /api/vapa endpoint (persistent storage)
      try {
        await axios.post('/api/vapa', {
          vapa: currentVapa, // Save VAPA to global endpoint (will use Math.max in API)
        });
        console.log('[connectVavityAsset] Saved VAPA to global endpoint:', currentVapa);
      } catch (error) {
        console.error('[connectVavityAsset] Error saving VAPA to global endpoint:', error);
      }
      
      // CRITICAL LOG: Only log VAPA calculation for debugging cpVatoc issue
      console.log('[connectVavityAsset] VAPA for cpVatoc (background):', {
        assetPriceParam: assetPrice,
        fetchedCurrentPrice,
        highestPriceEver,
        vapaParam: vapa,
        finalVapa: currentVapa,
        walletAddress,
      });

      // Step 8: Check if wallet already exists in VavityAggregator (for wallets that don't have depositPaid yet)
      const existingWallet = existingWallets.find(
        (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase() &&
                    (w.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === tokenAddr.toLowerCase()
      );

      let finalWalletData: any;

      if (existingWallet) {
        // Wallet exists but depositPaid is false, proceed with deposit
        // Update existing wallet: set depositPaid to true and update balance
        // Use balance AFTER deposit for accurate calculations
        const newCVactTaa = balanceAfterDeposit;
        // CRITICAL: cpVact should always be >= global VAPA
        // Fetch global VAPA again to ensure we have the latest (it might have been updated)
        let latestGlobalVapa = currentVapa;
        try {
          const latestVapaResponse = await axios.get('/api/vapa');
          latestGlobalVapa = latestVapaResponse.data?.vapa || currentVapa;
        } catch (error) {
          // Use currentVapa if fetch fails
        }
        // Use Math.max to ensure cpVact never goes below global VAPA
        const newCpVact = Math.max(existingWallet.cpVact || 0, latestGlobalVapa);
        // CRITICAL: Calculate cVact using formula: cVact = cVactTaa * cpVact
        const newCVact = newCVactTaa * newCpVact;
        // For existing wallets, cVatoc should remain unchanged (it's the value at time of connection)
        // But if it's missing or 0, recalculate it using the formula: cVatoc = cVactTaa * cpVatoc
        const shouldRecalculateCVatoc = !existingWallet.cVatoc || existingWallet.cVatoc === 0;
        const newCpVatoc = shouldRecalculateCVatoc ? currentVapa : existingWallet.cpVatoc;
        const newCVatoc = shouldRecalculateCVatoc 
          ? newCVactTaa * newCpVatoc  // Recalculate if missing
          : existingWallet.cVatoc;     // Keep existing value (it's the value at time of connection)
        const newCdVatoc = newCVact - newCVatoc;

        finalWalletData = {
          ...existingWallet,
          depositPaid: true, // Mark deposit as paid
          cVactTaa: newCVactTaa,
          cpVact: newCpVact, // Always >= currentVapa (VAPA)
          cpVatoc: newCpVatoc, // Update if it was 0 or missing
          cVatoc: parseFloat(newCVatoc.toFixed(2)), // Use calculated or existing value
          cVact: parseFloat(newCVact.toFixed(2)),
          cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
          // Ensure vapaa is always set
          vapaa: existingWallet.vapaa || tokenAddr,
        };

        // Update the wallet in the array
        const updatedWallets = existingWallets.map((w: any) => 
          w.walletId === existingWallet.walletId ? finalWalletData : w
        );

        // Recalculate vavityCombinations
        const vavityCombinations = existingData.vavityCombinations || {};
        await saveVavityAggregator(email, updatedWallets, vavityCombinations);
      } else {
        // Create new wallet with depositPaid = true
        // Use balance AFTER deposit for accurate calculations
        const walletId = params.walletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newCVactTaa = balanceAfterDeposit;
        // Fetch global VAPA to ensure cpVact matches it
        let latestGlobalVapa = currentVapa;
        try {
          const latestVapaResponse = await axios.get('/api/vapa');
          latestGlobalVapa = latestVapaResponse.data?.vapa || currentVapa;
        } catch (error) {
          // Use currentVapa if fetch fails
        }
        const newCpVact = latestGlobalVapa; // Always use global VAPA for new wallets
        const newCVact = newCVactTaa * newCpVact;
        const newCVatoc = newCVact; // cVatoc should equal cVact at connection time (after deposit)
        const newCpVatoc = currentVapa; // cpVatoc should always be VAPA at time of connection
        const newCdVatoc = newCVact - newCVatoc; // Should be 0 at connection time

        // Ensure cpVatoc and cpVact are set to global VAPA (at connection time)
        const finalCpVatoc = latestGlobalVapa; // Always use global VAPA for new wallets
        const finalCpVact = latestGlobalVapa; // cpVact should also be global VAPA for new wallets
        
        // CRITICAL: Calculate cVact and cVatoc using their respective formulas
        // cVact = cVactTaa * cpVact (current value at current price)
        // cVatoc = cVactTaa * cpVatoc (current value at time of connection price)
        // At connection time, cpVatoc = cpVact = VAPA, so cVatoc = cVact
        const recalculatedCVact = newCVactTaa * finalCpVact;
        const recalculatedCVatoc = newCVactTaa * finalCpVatoc; // Use explicit formula: cVactTaa * cpVatoc
        
        finalWalletData = {
          walletId: walletId,
          address: walletAddress,
          vapaa: tokenAddr, // Always set VAPAA (native ETH address for native tokens)
          depositPaid: true,
          cVatoc: parseFloat(recalculatedCVatoc.toFixed(2)),
          cpVatoc: finalCpVatoc, // Always set to currentVapa (VAPA at connection time)
          cVact: parseFloat(recalculatedCVact.toFixed(2)),
          cpVact: finalCpVact, // Always equals currentVapa for new wallets
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
          console.log('[connectVavityAsset] Adding wallet to VavityAggregator (background):', {
            address: walletAddress,
            walletId: finalWalletData.walletId,
            walletType: params.walletType,
            depositPaid: finalWalletData.depositPaid,
            walletData: finalWalletData,
          });
          const result = await addVavityAggregator(email, [finalWalletData]);
          console.log('[connectVavityAsset] Successfully added wallet to VavityAggregator (background):', result);
        } catch (error: any) {
          console.error('[connectVavityAsset] Error adding wallet to VavityAggregator (background):', error);
          console.error('[connectVavityAsset] Error details:', {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
          // If it's a duplicate error, that's okay - wallet might already exist
          // But we should still try to update it via saveVavityAggregator
          if (error?.response?.data?.error?.includes('duplicate') || error?.response?.data?.message?.includes('already exist')) {
            console.log('[connectVavityAsset] Wallet already exists, updating via saveVavityAggregator...');
            try {
              // Fetch existing wallets and update the one that matches
              const existingData = await fetchVavityAggregator(email);
              const existingWallets = existingData?.wallets || [];
              const walletIndex = existingWallets.findIndex(
                (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase() &&
                            (w.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === tokenAddr.toLowerCase()
              );
              
              if (walletIndex >= 0) {
                // Update existing wallet
                existingWallets[walletIndex] = finalWalletData;
                await saveVavityAggregator(email, existingWallets, {});
                console.log('[connectVavityAsset] Successfully updated existing wallet in VavityAggregator');
              } else {
                // Wallet doesn't exist but addVavityAggregator said it does - force add it
                console.log('[connectVavityAsset] Wallet not found in existing wallets, forcing add...');
                existingWallets.push(finalWalletData);
                await saveVavityAggregator(email, existingWallets, {});
                console.log('[connectVavityAsset] Successfully force-added wallet to VavityAggregator');
              }
            } catch (updateError) {
              console.error('[connectVavityAsset] Error updating wallet after duplicate error:', updateError);
              // Re-throw to ensure we know about this failure
              throw updateError;
            }
          } else {
            // Not a duplicate error - re-throw to ensure we know about it
            throw error;
          }
        }
      }

      // CRITICAL: Save VAPA to global endpoint BEFORE setting assetConnected
      // This ensures all VavityAggregator data is complete before marking as connected
      try {
        await axios.post('/api/vapa', {
          vapa: currentVapa, // Save VAPA to global endpoint (will use Math.max in API)
        });
        console.log('[connectVavityAsset] Saved VAPA to global endpoint (background):', currentVapa);
      } catch (vapaError) {
        console.error('[connectVavityAsset] Error saving VAPA to global endpoint (background):', vapaError);
      }

      // CRITICAL: Set assetConnected: true LAST - after all VavityAggregator data is set
      // This ensures the modal closes only when everything is complete
      try {
        const vavityResponse = await axios.get('/api/saveVavityConnection', { params: { email } });
        const connections = vavityResponse.data.vavityConnections || [];
        const matchingConnection = connections.find(
          (vc: any) => vc.address?.toLowerCase() === walletAddress.toLowerCase()
        );
        
        if (matchingConnection) {
          await axios.post('/api/saveVavityConnection', {
            email,
            vavityConnection: {
              ...matchingConnection,
              assetConnected: true, // Set LAST after all VavityAggregator updates
              txHash: txHash,
            },
          });
          console.log('[connectVavityAsset] Set assetConnected: true (LAST step)');
        } else {
          // Create new connection if it doesn't exist
          await axios.post('/api/saveVavityConnection', {
            email,
            vavityConnection: {
              address: walletAddress,
              walletId: finalWalletData.walletId || params.walletId || '',
              walletType: params.walletType,
              timestamp: Date.now(),
              assetConnected: true, // Set LAST after all VavityAggregator updates
              txHash: txHash,
            },
          });
          console.log('[connectVavityAsset] Created connection with assetConnected: true (LAST step)');
        }
        
        console.log('[connectVavityAsset] Marked deposit as completed in backend (background)');
      } catch (error) {
        console.error('[connectVavityAsset] Error updating backend after confirmation (background):', error);
      }
    } catch (error) {
      console.error('[connectVavityAsset] ===== CRITICAL ERROR in background confirmation process =====', error);
      console.error('[connectVavityAsset] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      // CRITICAL: Even if background process fails, try to create wallet as fallback
      // This ensures wallet is always created even if confirmation process has issues
      try {
        console.log('[connectVavityAsset] Attempting fallback wallet creation...');
        const fallbackBalance = balance || 0;
        const fallbackVapa = actualVapa || assetPrice || 0;
        const fallbackCVactTaa = fallbackBalance;
        const fallbackCpVact = fallbackVapa;
        const fallbackCVact = fallbackCVactTaa * fallbackCpVact;
        const fallbackWalletData = {
          walletId: params.walletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          address: walletAddress,
          vapaa: tokenAddr,
          depositPaid: true,
          cVatoc: parseFloat(fallbackCVact.toFixed(2)),
          cpVatoc: fallbackVapa,
          cVact: parseFloat(fallbackCVact.toFixed(2)),
          cpVact: fallbackCpVact,
          cVactTaa: fallbackCVactTaa,
          cdVatoc: 0,
        };
        console.log('[connectVavityAsset] Fallback wallet data:', fallbackWalletData);
        await addVavityAggregator(email, [fallbackWalletData]);
        console.log('[connectVavityAsset] Fallback wallet creation successful');
      } catch (fallbackError) {
        console.error('[connectVavityAsset] ===== FALLBACK WALLET CREATION ALSO FAILED =====', fallbackError);
        // Last resort: try saveVavityAggregator directly
        try {
          const existingData = await fetchVavityAggregator(email);
          const existingWallets = existingData?.wallets || [];
          const fallbackWalletData = {
            walletId: params.walletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            address: walletAddress,
            vapaa: tokenAddr,
            depositPaid: true,
            cVatoc: parseFloat((balance * (actualVapa || assetPrice || 0)).toFixed(2)),
            cpVatoc: actualVapa || assetPrice || 0,
            cVact: parseFloat((balance * (actualVapa || assetPrice || 0)).toFixed(2)),
            cpVact: actualVapa || assetPrice || 0,
            cVactTaa: balance || 0,
            cdVatoc: 0,
          };
          existingWallets.push(fallbackWalletData);
          await saveVavityAggregator(email, existingWallets, {});
          console.log('[connectVavityAsset] Last resort wallet creation via saveVavityAggregator successful');
        } catch (lastResortError) {
          console.error('[connectVavityAsset] ===== ALL WALLET CREATION ATTEMPTS FAILED =====', lastResortError);
        }
      }
    }
  })();

  // Return immediately with txHash - UI can update right away
  return { txHash, receipt: null, walletData };
}

// Export connectAsset as alias for backward compatibility during migration
export const connectAsset = connectVavityAsset;
