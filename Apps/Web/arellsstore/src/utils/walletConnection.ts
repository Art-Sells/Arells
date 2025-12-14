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
  console.log('Calling eth_requestAccounts on MetaMask provider...');
  const accounts = await ethereum.request({ 
    method: 'eth_requestAccounts' // This prompts the user if not connected
  });
  
  console.log('MetaMask accounts received:', accounts);
  
  return {
    accounts,
    provider: ethereum
  };
}

/**
 * Connect to Coinbase Wallet/Base
 * Tries desktop extension first, then mobile app via SDK
 */
export async function connectCoinbaseWallet(): Promise<WalletConnectionResult> {
  // First, check if Coinbase Wallet extension is available directly
  let ethereum: any = null;
  
  // Check if there are multiple providers
  if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
    // Multiple wallets installed - find Coinbase Wallet specifically
    ethereum = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
    console.log('Multiple wallets detected, found Coinbase Wallet/Base:', !!ethereum);
  } 
  // Check if Coinbase Wallet/Base is the primary provider
  else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
    ethereum = (window as any).ethereum;
    console.log('Coinbase Wallet/Base is primary provider');
  }
  
  if (ethereum && (ethereum.isCoinbaseWallet || ethereum.isBase)) {
    // Desktop extension is available - use it directly
    console.log('Coinbase Wallet/Base extension confirmed, requesting connection...');
    console.log('Coinbase Wallet/Base provider:', ethereum);
    
    // Directly request accounts - this WILL prompt if site is not connected
    console.log('Calling eth_requestAccounts on Coinbase Wallet/Base provider...');
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' // This prompts the user if not connected
    });
    
    console.log('Coinbase Wallet/Base accounts received:', accounts);
    
    return {
      accounts,
      provider: ethereum
    };
  } else {
    // No extension - use Coinbase Wallet SDK to open mobile app
    console.log('Coinbase Wallet/Base extension not found, using SDK to open mobile app...');
    const coinbaseWallet = new CoinbaseWalletSDK({
      appName: 'Arells',
      appLogoUrl: 'https://arells.com/images/Arells-Icon.png',
      darkMode: false
    });

    // Use Coinbase Wallet SDK which will open mobile app if extension not available
    const ethereumProvider = coinbaseWallet.makeWeb3Provider();
    console.log('Requesting Base/Coinbase Wallet connection via SDK (will open mobile app if needed)...');
    
    const accounts = await ethereumProvider.request({ 
      method: 'eth_requestAccounts'
    });
    
    console.log('Coinbase Wallet/Base accounts received via SDK:', accounts);
    
    return {
      accounts,
      provider: ethereumProvider
    };
  }
}

/**
 * Main wallet connection function
 */
export async function connectWallet(walletType: WalletType): Promise<WalletConnectionResult> {
  if (walletType === 'metamask') {
    return await connectMetaMask();
  } else if (walletType === 'base') {
    return await connectCoinbaseWallet();
  } else {
    throw new Error(`Unknown wallet type: ${walletType}`);
  }
}

