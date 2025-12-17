import { ethers } from 'ethers';

const DEPOSIT_ADDRESS = '0x3DfA7Ea24570148a6B4A3FADC5DFE373b1ecD70B';
const DEPOSIT_PERCENTAGE = 0.005; // 0.5%

// ERC20 ABI for transfer
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
];

export interface DepositParams {
  provider: any; // Web3 provider from wallet
  walletAddress: string;
  tokenAddress?: string; // If undefined, use native ETH
  balance: number; // Current balance of the asset
}

/**
 * Calculates 0.5% of the given balance
 */
export function calculateDepositAmount(balance: number): number {
  return balance * DEPOSIT_PERCENTAGE;
}

/**
 * Sends a deposit transaction (0.5% of balance) to the deposit address
 * Returns the transaction hash
 */
export async function sendDepositTransaction(params: DepositParams): Promise<string> {
  const { provider, walletAddress, tokenAddress, balance } = params;
  
  const depositAmount = calculateDepositAmount(balance);
  
  if (depositAmount <= 0) {
    throw new Error('Deposit amount must be greater than 0. Your wallet balance may be too low.');
  }
  
  // Check if deposit amount is too small (less than 0.000001)
  if (depositAmount < 0.000001) {
    throw new Error('Deposit amount is too small. Please ensure your wallet has sufficient balance.');
  }

  // Wrap provider in BrowserProvider for client-side usage
  const browserProvider = new ethers.BrowserProvider(provider);
  const signer = await browserProvider.getSigner();
  
  try {
    const network = await browserProvider.getNetwork();
    console.log(`[depositTransaction] Sending deposit: ${depositAmount} to ${DEPOSIT_ADDRESS}`);
    console.log(`[depositTransaction] Token: ${tokenAddress || 'Native ETH'}`);
    console.log(`[depositTransaction] Network: ${network.name} (chainId: ${network.chainId})`);
  } catch (error) {
    console.log(`[depositTransaction] Sending deposit: ${depositAmount} to ${DEPOSIT_ADDRESS}`);
    console.log(`[depositTransaction] Token: ${tokenAddress || 'Native ETH'}`);
  }

  let tx: ethers.ContractTransactionResponse;

  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    // Send native ETH
    // Format deposit amount to avoid precision issues
    const depositAmountFormatted = depositAmount.toFixed(18);
    const txResponse = await signer.sendTransaction({
      to: DEPOSIT_ADDRESS,
      value: ethers.parseEther(depositAmountFormatted),
    });
    tx = txResponse;
  } else {
    // Send ERC20 token
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Get token decimals
    const decimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(depositAmount.toFixed(18), decimals);
    
    // Send transfer transaction
    tx = await tokenContract.transfer(DEPOSIT_ADDRESS, amountInWei);
  }

  console.log(`[depositTransaction] Transaction sent: ${tx.hash}`);
  return tx.hash;
}

/**
 * Waits for a transaction to be confirmed
 * Returns the transaction receipt
 */
export async function waitForTransactionConfirmation(
  provider: any,
  txHash: string,
  confirmations: number = 1
): Promise<ethers.ContractTransactionReceipt | null> {
  console.log(`[depositTransaction] Waiting for confirmation of ${txHash}...`);
  
  try {
    // Wrap provider in BrowserProvider for client-side usage
    const browserProvider = new ethers.BrowserProvider(provider);
    const receipt = await browserProvider.waitForTransaction(txHash, confirmations);
    console.log(`[depositTransaction] Transaction confirmed: ${txHash}`);
    return receipt;
  } catch (error) {
    console.error(`[depositTransaction] Error waiting for transaction:`, error);
    throw error;
  }
}

/**
 * Complete deposit flow: send transaction and wait for confirmation
 */
export async function completeDepositFlow(params: DepositParams): Promise<{
  txHash: string;
  receipt: ethers.ContractTransactionReceipt | null;
}> {
  const txHash = await sendDepositTransaction(params);
  const receipt = await waitForTransactionConfirmation(params.provider, txHash);
  
  return { txHash, receipt };
}

