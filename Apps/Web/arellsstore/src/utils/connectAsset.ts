import { ethers } from 'ethers';
import { completeDepositFlow, calculateDepositAmount } from './depositTransaction';

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
    
    // Update wallet balance without deposit
    const currentVapa = Math.max(vapa || 0, assetPrice || 0);
    const newCVactTaa = balance; // Use balance before deposit (no deposit was sent)
    const newCpVact = Math.max(existingWalletBeforeDeposit.cpVact || 0, currentVapa);
    const newCVact = newCVactTaa * newCpVact;
    const newCdVatoc = newCVact - (existingWalletBeforeDeposit.cVatoc || 0);

    const walletData = {
      ...existingWalletBeforeDeposit,
      depositPaid: true, // Keep depositPaid as true
      cVactTaa: newCVactTaa,
      cpVact: newCpVact,
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
  let balanceAfterDeposit: number;
  try {
    const balanceResponseAfterDeposit = await fetch(`/api/tokenBalance?address=${encodeURIComponent(walletAddress)}&tokenAddress=${encodeURIComponent(tokenAddr)}`);
    
    if (!balanceResponseAfterDeposit.ok) {
      const errorText = await balanceResponseAfterDeposit.text();
      console.error(`[connectAsset] Balance API error after deposit (${balanceResponseAfterDeposit.status}):`, errorText);
      throw new Error(`Failed to fetch wallet balance after deposit: ${balanceResponseAfterDeposit.status} ${balanceResponseAfterDeposit.statusText}. ${errorText}`);
    }
    
    const balanceDataAfterDeposit = await balanceResponseAfterDeposit.json();
    balanceAfterDeposit = parseFloat(balanceDataAfterDeposit.balance || '0');
    
    if (isNaN(balanceAfterDeposit)) {
      throw new Error(`Invalid balance returned from API after deposit: ${balanceDataAfterDeposit.balance}`);
    }

    console.log(`[connectAsset] Balance after deposit for ${walletAddress}: ${balanceAfterDeposit} (was ${balance} before deposit)`);
  } catch (error: any) {
    console.error(`[connectAsset] Error fetching balance after deposit:`, error);
    // Fallback to using the balance before deposit if we can't fetch after
    console.warn(`[connectAsset] Using balance before deposit as fallback`);
    balanceAfterDeposit = balance;
  }

  // Step 7: Check if wallet already exists in VavityAggregator (for wallets that don't have depositPaid yet)
  const existingData = await fetchVavityAggregator(email);
  const existingWallets = existingData.wallets || [];
  const existingWallet = existingWallets.find(
    (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase() &&
                (w.vapaa || '0x0000000000000000000000000000000000000000').toLowerCase() === tokenAddr.toLowerCase()
  );

  let walletData: any;
  const currentVapa = Math.max(vapa || 0, assetPrice || 0);
  const currentAssetPrice = assetPrice || currentVapa;

  if (existingWallet) {
    // Wallet exists but depositPaid is false, proceed with deposit
    // Update existing wallet: set depositPaid to true and update balance
    // Use balance AFTER deposit for accurate calculations
    const newCVactTaa = balanceAfterDeposit;
    const newCpVact = Math.max(existingWallet.cpVact || 0, currentVapa);
    const newCVact = newCVactTaa * newCpVact;
    const newCdVatoc = newCVact - (existingWallet.cVatoc || 0);

    walletData = {
      ...existingWallet,
      depositPaid: true, // Mark deposit as paid
      cVactTaa: newCVactTaa,
      cpVact: newCpVact,
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
    const newCpVatoc = currentAssetPrice;
    const newCdVatoc = newCVact - newCVatoc; // Should be 0 at connection time

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

