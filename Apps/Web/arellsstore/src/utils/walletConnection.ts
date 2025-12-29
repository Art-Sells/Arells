import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';

export type WalletType = 'metamask' | 'base';

export interface WalletConnectionResult {
  accounts: string[];
  provider: any;
}

/**
 * Connect to MetaMask wallet
 * Tries desktop extension first, then mobile app
 */
export async function connectMetaMask(): Promise<WalletConnectionResult> {
  // Detect MetaMask - handle multiple wallet providers correctly
  let ethereum: any = null;
  
  // First check if there are multiple providers
  if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
    // Multiple wallets installed - find MetaMask specifically
    ethereum = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
    console.log('Multiple wallets detected, found MetaMask:', !!ethereum);
  } 
  // Check if MetaMask is the primary provider
  else if ((window as any).ethereum?.isMetaMask) {
    ethereum = (window as any).ethereum;
    console.log('MetaMask is primary provider');
  }
  
  if (!ethereum) {
    // No extension - try to open MetaMask mobile app
    console.log('MetaMask extension not found, attempting to open mobile app...');
    const metamaskDeepLink = `https://metamask.app.link/dapp/${encodeURIComponent(window.location.href)}`;
    window.open(metamaskDeepLink, '_blank');
    
    throw new Error('MetaMask extension not found. Opening mobile app... Please connect in the app and try again.');
  }
  
  // Verify it's actually MetaMask
  if (!ethereum.isMetaMask) {
    throw new Error('MetaMask not detected. Please install MetaMask extension.');
  }
  
  // Desktop extension is available - use it
  console.log('MetaMask extension confirmed, requesting connection...');
  console.log('MetaMask provider:', ethereum);
  
  // Check existing permissions first
  try {
    const permissions = await ethereum.request({ method: 'wallet_getPermissions' });
    console.log('Current MetaMask permissions:', permissions);
    const hasAccountsPermission = permissions.some(
      (perm: any) => perm.parentCapability === 'eth_accounts'
    );
    
    if (hasAccountsPermission) {
      console.log('MetaMask already has accounts permission - will revoke and re-request');
      // Revoke existing permissions to force a new prompt
      try {
        await ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
        console.log('MetaMask permissions revoked, will request new connection');
      } catch (revokeError: any) {
        console.log('Could not revoke permissions (may not be supported):', revokeError);
      }
    }
  } catch (permCheckError) {
    console.log('Could not check permissions:', permCheckError);
  }
  
  // Directly request accounts - this WILL prompt if site is not connected
  console.log('[connectMetaMask] 🚀 Calling eth_requestAccounts on MetaMask provider...');
  console.log('[connectMetaMask] 🚀 If user cancels, error will be thrown here');
  try {
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' // This prompts the user if not connected
    });
    console.log('[connectMetaMask] ✅ eth_requestAccounts succeeded, accounts:', accounts);
    return {
      accounts,
      provider: ethereum
    };
  } catch (error: any) {
    console.error('[connectMetaMask] ❌❌❌ ERROR FROM eth_requestAccounts:', {
      error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      message: error?.message,
      code: error?.code,
      errorError: error?.error,
      errorErrorCode: error?.error?.code,
      errorErrorMessage: error?.error?.message,
      errorString: String(error),
      errorJSON: JSON.stringify(error, null, 2),
      stack: error?.stack
    });
    console.error('[connectMetaMask] ❌ About to re-throw this error to connectAsset catch block...');
    throw error;
  }
}

/**
 * Connect to Coinbase Wallet/Base
 * Tries desktop extension first, then mobile app via SDK
 */
export async function connectCoinbaseWallet(): Promise<WalletConnectionResult> {
  // Always initialize SDK first to set app logo/metadata
  // Get the current origin to construct the logo URL
  const logoUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/ArellsIcoIcon.png`
    : 'https://arells.com/ArellsIcoIcon.png';
  
  const coinbaseWallet = new CoinbaseWalletSDK({
    appName: 'Arells',
    appLogoUrl: logoUrl,
    darkMode: false
  });

  // Get provider from SDK - this will use extension if available, otherwise mobile
  // The SDK automatically handles the correct provider selection and includes logo metadata
  const ethereumProvider = coinbaseWallet.makeWeb3Provider();
  
  // Check if we're using the extension or mobile
  const isExtension = ethereumProvider.isCoinbaseWallet || ethereumProvider.isBase;
  
  if (isExtension) {
    console.log('Coinbase Wallet/Base extension detected, using SDK provider with logo...');
    
    // Coinbase Wallet doesn't support wallet_getPermissions, so we'll try a different approach
    // First, check if already connected using eth_accounts (non-prompting)
    let existingAccounts: string[] = [];
    try {
      existingAccounts = await ethereumProvider.request({ method: 'eth_accounts' });
      if (existingAccounts && existingAccounts.length > 0) {
        console.log('Coinbase Wallet/Base already connected to:', existingAccounts);
        
        // Try to revoke permissions to force a new prompt
        try {
          await ethereumProvider.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          });
          console.log('Coinbase Wallet/Base permissions revoked, will request new connection');
          // Wait a moment for revocation to take effect
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (revokeError: any) {
          console.log('Could not revoke permissions (Coinbase Wallet does not support this):', revokeError);
          // Coinbase Wallet doesn't support revocation, so we need to tell the user to disconnect manually
          throw new Error(
            `Coinbase Wallet is already connected to ${existingAccounts[0]}. ` +
            `Please disconnect this site in your Coinbase Wallet extension first, then try connecting again. ` +
            `(Go to Coinbase Wallet extension → Settings → Connected Sites → Remove this site)`
          );
        }
      }
    } catch (checkError: any) {
      // If it's our custom error about needing to disconnect, re-throw it
      if (checkError.message && checkError.message.includes('already connected')) {
        throw checkError;
      }
      console.log('Could not check existing connection:', checkError);
    }
  } else {
    console.log('Coinbase Wallet/Base extension not found, using SDK for mobile app...');
  }
  
  // Use SDK provider which includes logo metadata
  console.log('Requesting Base/Coinbase Wallet connection via SDK (with logo)...');
  
  const accounts = await ethereumProvider.request({ 
    method: 'eth_requestAccounts'
  });
  
  console.log('Coinbase Wallet/Base accounts received:', accounts);
  
  return {
    accounts,
    provider: ethereumProvider
  };
}

/**
 * Main wallet connection function
 */
export async function connectWallet(walletType: WalletType): Promise<WalletConnectionResult> {
  console.log('[connectWallet] 🚀 Function called with walletType:', walletType);
  console.log('[connectWallet] 🚀 About to call connectMetaMask/connectCoinbaseWallet');
  try {
    if (walletType === 'metamask') {
      const result = await connectMetaMask();
      console.log('[connectWallet] ✅ connectMetaMask succeeded');
      return result;
    } else if (walletType === 'base') {
      const result = await connectCoinbaseWallet();
      console.log('[connectWallet] ✅ connectCoinbaseWallet succeeded');
      return result;
    } else {
      throw new Error(`Unknown wallet type: ${walletType}`);
    }
  } catch (error: any) {
    console.error('[connectWallet] ❌❌❌ ERROR CAUGHT - About to re-throw to connectAsset:', {
      error,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorError: error?.error,
      stack: error?.stack
    });
    throw error;
  }
}

