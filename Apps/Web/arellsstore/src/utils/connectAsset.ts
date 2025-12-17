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
  const tokenAddr = tokenAddress || '0x0000000000000000000000000000000000000000';
  const balanceResponse = await fetch(`/api/tokenBalance?address=${walletAddress}&tokenAddress=${tokenAddr}`);
  if (!balanceResponse.ok) {
    throw new Error('Failed to fetch wallet balance');
  }
  const balanceData = await balanceResponse.json();
  const balance = parseFloat(balanceData.balance || '0');

  console.log(`[connectAsset] Balance for ${walletAddress}: ${balance}`);

  // Step 2: Calculate deposit amount (0.5% of balance)
  const depositAmount = calculateDepositAmount(balance);
  console.log(`[connectAsset] Deposit amount (0.5%): ${depositAmount}`);

  // Step 3: Prompt user for deposit
  const depositConfirmed = window.confirm(
    `To connect your asset, please deposit 0.5% of your balance (${depositAmount.toFixed(6)} ${tokenAddr === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'tokens'}) to the deposit address.\n\n` +
    `Deposit Address: ${DEPOSIT_ADDRESS}\n\n` +
    `Click OK to proceed with the deposit transaction.`
  );

  if (!depositConfirmed) {
    throw new Error('Deposit cancelled by user');
  }

  // Step 4: Send deposit transaction and wait for confirmation
  const { txHash, receipt } = await completeDepositFlow({
    provider,
    walletAddress,
    tokenAddress: tokenAddr === '0x0000000000000000000000000000000000000000' ? undefined : tokenAddr,
    balance,
  });

  console.log(`[connectAsset] Deposit transaction confirmed: ${txHash}`);

  // Step 5: Check if wallet already exists in VavityAggregator
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
    // Update existing wallet: set depositPaid to true and update balance
    const newCVactTaa = balance;
    const newCpVact = Math.max(existingWallet.cpVact || 0, currentVapa);
    const newCVact = newCVactTaa * newCpVact;
    const newCdVatoi = newCVact - (existingWallet.cVatoi || 0);

    walletData = {
      ...existingWallet,
      depositPaid: true, // Mark deposit as paid
      cVactTaa: newCVactTaa,
      cpVact: newCpVact,
      cVact: parseFloat(newCVact.toFixed(2)),
      cdVatoi: parseFloat(newCdVatoi.toFixed(2)),
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
    const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCVactTaa = balance;
    const newCpVact = currentVapa;
    const newCVact = newCVactTaa * newCpVact;
    const newCVatoi = newCVact;
    const newCpVatoi = currentAssetPrice;
    const newCdVatoi = newCVact - newCVatoi;

    walletData = {
      walletId: walletId,
      address: walletAddress,
      vapaa: tokenAddr,
      depositPaid: true, // Mark deposit as paid
      cVatoi: newCVatoi,
      cpVatoi: newCpVatoi,
      cVact: newCVact,
      cpVact: newCpVact,
      cVactTaa: newCVactTaa,
      cdVatoi: newCdVatoi,
    };

    // Add new wallet to VavityAggregator
    await addVavityAggregator(email, [walletData]);
  }

  console.log(`[connectAsset] Wallet connected with depositPaid=true:`, walletData);

  return { txHash, receipt, walletData };
}

