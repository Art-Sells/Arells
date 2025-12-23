import { ethers } from 'ethers';

const DEPOSIT_ADDRESS = '0x3DfA7Ea24570148a6B4A3FADC5DFE373b1ecD70B';

/**
 * Checks if a deposit transaction was already sent from the wallet to the deposit address
 * Returns the transaction hash if found, null otherwise
 * 
 * This checks the last 100 blocks (faster than checking 1000 blocks)
 */
export async function checkExistingDepositTransaction(
  provider: any,
  walletAddress: string,
  tokenAddress?: string
): Promise<string | null> {
  try {
    const browserProvider = new ethers.BrowserProvider(provider);
    
    // For native ETH, check recent transactions from the wallet
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      // Get current block number
      const currentBlock = await browserProvider.getBlockNumber();
      
      // Check last 100 blocks (roughly last 20 minutes on most chains)
      // This is faster and should catch recent deposits
      const blocksToCheck = Math.min(100, currentBlock);
      const startBlock = Math.max(0, currentBlock - blocksToCheck);
      
      // Try to find a transaction from this wallet to the deposit address
      // Check blocks in reverse order (most recent first)
      for (let i = currentBlock; i >= startBlock; i -= 5) { // Check every 5th block for speed
        try {
          const block = await browserProvider.getBlock(i, true);
          if (block && block.transactions) {
            for (const tx of block.transactions) {
              if (typeof tx === 'string') continue;
              
              // Check if transaction is from our wallet to deposit address
              if (
                tx.from?.toLowerCase() === walletAddress.toLowerCase() &&
                tx.to?.toLowerCase() === DEPOSIT_ADDRESS.toLowerCase() &&
                tx.value && tx.value > 0n
              ) {
                // Found a deposit transaction - verify it's confirmed
                const receipt = await browserProvider.getTransactionReceipt(tx.hash);
                if (receipt && receipt.status === 1) {
                  return tx.hash;
                }
              }
            }
          }
        } catch (error) {
          // Continue checking other blocks
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[checkDepositTransaction] Error checking for existing deposit:', error);
    return null;
  }
}

/**
 * Checks if a transaction hash exists and is confirmed
 */
export async function verifyTransactionExists(
  provider: any,
  txHash: string
): Promise<boolean> {
  try {
    const browserProvider = new ethers.BrowserProvider(provider);
    const receipt = await browserProvider.getTransactionReceipt(txHash);
    return receipt !== null && receipt.status === 1; // Status 1 = success
  } catch (error) {
    return false;
  }
}
