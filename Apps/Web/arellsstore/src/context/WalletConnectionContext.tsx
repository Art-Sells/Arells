'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { connectWallet as connectWalletUtil, WalletType } from '../utils/walletConnection';
import { useVavity } from './VavityAggregator';

interface WalletConnectionContextType {
  // Auto-connected wallets (detected on page load)
  autoConnectedMetaMask: string | null;
  autoConnectedBase: string | null;
  
  // Currently connecting state
  isConnectingMetaMask: boolean;
  isConnectingBase: boolean;
  
  // Connected wallets state (after successful connection)
  connectedMetaMask: boolean;
  connectedBase: boolean;
  
  // Connect wallet function (handles entire connection flow including balance, adding to VavityAggregator, and reload)
  connectWallet: (walletType: WalletType) => Promise<void>;
  
  // Clear auto-connected wallets (when user disconnects)
  clearAutoConnectedMetaMask: () => void;
  clearAutoConnectedBase: () => void;
}

const WalletConnectionContext = createContext<WalletConnectionContextType | undefined>(undefined);

export const WalletConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoConnectedMetaMask, setAutoConnectedMetaMask] = useState<string | null>(null);
  const [autoConnectedBase, setAutoConnectedBase] = useState<string | null>(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState<boolean>(false);
  const [isConnectingBase, setIsConnectingBase] = useState<boolean>(false);
  
  // Initialize connected state from localStorage on mount
  const [connectedMetaMask, setConnectedMetaMask] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('lastConnectedMetaMask');
    }
    return false;
  });
  const [connectedBase, setConnectedBase] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('lastConnectedBase');
    }
    return false;
  });
  
  // Get VavityAggregator context for wallet operations
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator } = useVavity();
  
  // Process pending wallet after reload - only run once per pending wallet
  useEffect(() => {
    let isProcessing = false;
    let hasProcessed = false;
    
    const processPendingWallet = async () => {
      if (!email || typeof window === 'undefined') return;
      if (isProcessing || hasProcessed) return; // Prevent multiple executions
      
      const pendingAddress = sessionStorage.getItem('pendingWalletAddress');
      const pendingType = sessionStorage.getItem('pendingWalletType');
      
      if (!pendingAddress || !pendingType) return;
      
      // Check if we've already processed this address
      const processedKey = `processed_${pendingAddress.toLowerCase()}`;
      if (sessionStorage.getItem(processedKey)) {
        console.log('Pending wallet already processed, clearing flags');
        sessionStorage.removeItem('pendingWalletAddress');
        sessionStorage.removeItem('pendingWalletType');
        return;
      }
      
      isProcessing = true;
      console.log('Processing pending wallet after reload:', pendingAddress);
      
      try {
        // Check if wallet is already connected
        const existingData = await fetchVavityAggregator(email);
        const existingWallets = existingData.wallets || [];
        const addressAlreadyConnected = existingWallets.some(
          (wallet: any) => wallet.address?.toLowerCase() === pendingAddress.toLowerCase()
        );

        if (addressAlreadyConnected) {
          console.log('Pending wallet already in VavityAggregator, skipping');
          sessionStorage.setItem(processedKey, 'true');
          sessionStorage.removeItem('pendingWalletAddress');
          sessionStorage.removeItem('pendingWalletType');
          isProcessing = false;
          hasProcessed = true;
          return;
        }

        // Create wallet data (balance will be fetched by VavityAggregator)
        const currentVapa = Math.max(vapa || 0, assetPrice || 0);
        const currentAssetPrice = assetPrice || currentVapa;
        const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newCVactTaa = 0; // Balance will be fetched by VavityAggregator
        const newCpVact = currentVapa;
        const newCVact = newCVactTaa * newCpVact;
        const newCVatoi = newCVact;
        const newCpVatoi = currentAssetPrice;
        const newCdVatoi = newCVact - newCVatoi;
        
        const walletData = {
          walletId: walletId,
          address: pendingAddress,
          cVatoi: newCVatoi,
          cpVatoi: newCpVatoi,
          cVact: newCVact,
          cpVact: newCpVact,
          cVactTaa: newCVactTaa,
          cdVatoi: newCdVatoi,
        };

        // Add to VavityAggregator
        await addVavityAggregator(email, [walletData]);
        console.log('Pending wallet added to VavityAggregator');
        
        // Mark as processed and clear pending flags
        sessionStorage.setItem(processedKey, 'true');
        sessionStorage.removeItem('pendingWalletAddress');
        sessionStorage.removeItem('pendingWalletType');
        hasProcessed = true;
      } catch (error) {
        console.error('Error processing pending wallet:', error);
      } finally {
        isProcessing = false;
      }
    };
    
    processPendingWallet();
  }, [email]); // Only depend on email to prevent multiple runs
  
  // Check connected wallets on mount and when email changes
  useEffect(() => {
    const checkConnectedWallets = async () => {
      if (!email) {
        setConnectedMetaMask(false);
        setConnectedBase(false);
        return;
      }
      
      try {
        // Check localStorage first - if address exists, show as connected
        // This handles the case where we reload before wallet is added to VavityAggregator
        const lastConnectedMetaMask = localStorage.getItem('lastConnectedMetaMask');
        const lastConnectedBase = localStorage.getItem('lastConnectedBase');
        
        // Also check if wallet is actually connected to the extension
        let metaMaskExtensionConnected = false;
        let metaMaskAccount: string | null = null;
        let baseExtensionConnected = false;
        let baseAccount: string | null = null;
        
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          // Check MetaMask
          let metamaskProvider: any = null;
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
          } else if ((window as any).ethereum?.isMetaMask) {
            metamaskProvider = (window as any).ethereum;
          }
          
          if (metamaskProvider) {
            try {
              const accounts = await metamaskProvider.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                metaMaskAccount = accounts[0];
                // If we have a stored address, check if it matches
                if (lastConnectedMetaMask) {
                  metaMaskExtensionConnected = lastConnectedMetaMask.toLowerCase() === metaMaskAccount.toLowerCase();
                } else {
                  // If no stored address but extension has accounts, it's connected
                  metaMaskExtensionConnected = true;
                  // Auto-set localStorage if extension is connected but we don't have it stored
                  console.log('[WalletConnection] MetaMask extension connected but not in localStorage, setting it now');
                  localStorage.setItem('lastConnectedMetaMask', metaMaskAccount);
                }
              }
            } catch (error) {
              console.log('Could not check MetaMask connection:', error);
            }
          }
          
          // Check Base/Coinbase Wallet
          let coinbaseProvider: any = null;
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            coinbaseProvider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            coinbaseProvider = (window as any).ethereum;
          }
          
          if (coinbaseProvider) {
            try {
              const accounts = await coinbaseProvider.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                baseAccount = accounts[0];
                // If we have a stored address, check if it matches
                if (lastConnectedBase) {
                  baseExtensionConnected = lastConnectedBase.toLowerCase() === baseAccount.toLowerCase();
                } else {
                  // If no stored address but extension has accounts, it's connected
                  baseExtensionConnected = true;
                  // Auto-set localStorage if extension is connected but we don't have it stored
                  console.log('[WalletConnection] Base extension connected but not in localStorage, setting it now');
                  localStorage.setItem('lastConnectedBase', baseAccount);
                }
              }
            } catch (error) {
              console.log('Could not check Base connection:', error);
            }
          }
        }
        
        // Fetch wallets from VavityAggregator to verify
        const data = await fetchVavityAggregator(email);
        const wallets = data?.wallets || [];
        
        console.log('[WalletConnection] Checking connected wallets. Total wallets:', wallets.length);
        console.log('[WalletConnection] Last connected MetaMask:', lastConnectedMetaMask);
        console.log('[WalletConnection] Last connected Base:', lastConnectedBase);
        console.log('[WalletConnection] MetaMask extension account:', metaMaskAccount);
        console.log('[WalletConnection] MetaMask extension connected:', metaMaskExtensionConnected);
        console.log('[WalletConnection] Base extension account:', baseAccount);
        console.log('[WalletConnection] Base extension connected:', baseExtensionConnected);
        
        // Check if wallets match stored addresses
        let metaMaskInWallets = false;
        let baseInWallets = false;
        
        if (lastConnectedMetaMask) {
          metaMaskInWallets = wallets.some((wallet: any) => 
            wallet.address?.toLowerCase() === lastConnectedMetaMask.toLowerCase()
          );
        }
        
        if (lastConnectedBase) {
          baseInWallets = wallets.some((wallet: any) => 
            wallet.address?.toLowerCase() === lastConnectedBase.toLowerCase()
          );
        }
        
        // Show as connected if:
        // 1. Address is in localStorage (this means user connected, even if not yet in VavityAggregator)
        // 2. OR wallet is in VavityAggregator
        // 3. OR extension is still connected
        const metaMaskConnected = !!(lastConnectedMetaMask || metaMaskInWallets || metaMaskExtensionConnected);
        const baseConnected = !!(lastConnectedBase || baseInWallets || baseExtensionConnected);
        
        // If extension is disconnected AND wallet not in VavityAggregator, clear the state
        if (lastConnectedMetaMask && !metaMaskExtensionConnected && !metaMaskInWallets) {
          console.log('[WalletConnection] MetaMask disconnected - clearing state');
          localStorage.removeItem('lastConnectedMetaMask');
          setConnectedMetaMask(false);
        } else {
          // Set connected state based on any of the conditions
          setConnectedMetaMask(metaMaskConnected);
        }
        
        if (lastConnectedBase && !baseExtensionConnected && !baseInWallets) {
          console.log('[WalletConnection] Base disconnected - clearing state');
          localStorage.removeItem('lastConnectedBase');
          setConnectedBase(false);
        } else {
          // Set connected state based on any of the conditions
          setConnectedBase(baseConnected);
        }
        
        console.log('[WalletConnection] Final state - MetaMask:', metaMaskConnected, 'Base:', baseConnected);
        console.log('[WalletConnection] State set - connectedMetaMask:', metaMaskConnected, 'connectedBase:', baseConnected);
      } catch (error) {
        console.error('[WalletConnection] Error checking connected wallets:', error);
        setConnectedMetaMask(false);
        setConnectedBase(false);
      }
    };
    
    // Check immediately and also after a delay to catch wallets that load later
    checkConnectedWallets();
    const timeoutId = setTimeout(() => {
      checkConnectedWallets();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [email, fetchVavityAggregator]);
  
  // Also listen for wallet disconnection events and periodically check connection status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkWalletConnection = async () => {
      const lastConnectedMetaMask = localStorage.getItem('lastConnectedMetaMask');
      const lastConnectedBase = localStorage.getItem('lastConnectedBase');
      
      if (lastConnectedMetaMask) {
        // Check MetaMask provider specifically
        let metamaskProvider: any = null;
        if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
          metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
        } else if ((window as any).ethereum?.isMetaMask) {
          metamaskProvider = (window as any).ethereum;
        }
        
        if (metamaskProvider) {
          try {
            const accounts = await metamaskProvider.request({ method: 'eth_accounts' });
            const stillConnected = accounts && accounts.length > 0 && 
              accounts.some((addr: string) => addr.toLowerCase() === lastConnectedMetaMask.toLowerCase());
            
            if (!stillConnected) {
              console.log('[WalletConnection] MetaMask disconnected - no accounts match');
              localStorage.removeItem('lastConnectedMetaMask');
              setConnectedMetaMask(false);
            }
          } catch (error) {
            console.log('[WalletConnection] Error checking MetaMask connection:', error);
            // If we can't check, assume disconnected
            localStorage.removeItem('lastConnectedMetaMask');
            setConnectedMetaMask(false);
          }
        } else {
          // MetaMask not available, clear state
          console.log('[WalletConnection] MetaMask provider not found');
          localStorage.removeItem('lastConnectedMetaMask');
          setConnectedMetaMask(false);
        }
      }
      
      if (lastConnectedBase) {
        // Check Base/Coinbase Wallet provider specifically
        let coinbaseProvider: any = null;
        if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
          coinbaseProvider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
        } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
          coinbaseProvider = (window as any).ethereum;
        }
        
        if (coinbaseProvider) {
          try {
            const accounts = await coinbaseProvider.request({ method: 'eth_accounts' });
            const stillConnected = accounts && accounts.length > 0 && 
              accounts.some((addr: string) => addr.toLowerCase() === lastConnectedBase.toLowerCase());
            
            if (!stillConnected) {
              console.log('[WalletConnection] Base disconnected - no accounts match');
              localStorage.removeItem('lastConnectedBase');
              setConnectedBase(false);
            }
          } catch (error) {
            console.log('[WalletConnection] Error checking Base connection:', error);
            // If we can't check, assume disconnected
            localStorage.removeItem('lastConnectedBase');
            setConnectedBase(false);
          }
        } else {
          // Base not available, clear state
          console.log('[WalletConnection] Base provider not found');
          localStorage.removeItem('lastConnectedBase');
          setConnectedBase(false);
        }
      }
    };
    
    // Check immediately
    checkWalletConnection();
    
    // Check periodically every 2 seconds
    const intervalId = setInterval(checkWalletConnection, 2000);
    
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('[WalletConnection] Accounts changed:', accounts);
      checkWalletConnection();
    };
    
    // Listen for account changes from MetaMask provider
    if ((window as any).ethereum) {
      let metamaskProvider: any = null;
      if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
        metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
      } else if ((window as any).ethereum?.isMetaMask) {
        metamaskProvider = (window as any).ethereum;
      }
      
      if (metamaskProvider && metamaskProvider.on) {
        metamaskProvider.on('accountsChanged', handleAccountsChanged);
      }
      
      // Also listen on main ethereum object
      if ((window as any).ethereum.on) {
        (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      }
    }
    
    return () => {
      clearInterval(intervalId);
      if ((window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
      // Remove from MetaMask provider if it exists
      if ((window as any).ethereum) {
        let metamaskProvider: any = null;
        if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
          metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
        } else if ((window as any).ethereum?.isMetaMask) {
          metamaskProvider = (window as any).ethereum;
        }
        if (metamaskProvider?.removeListener) {
          metamaskProvider.removeListener('accountsChanged', handleAccountsChanged);
        }
      }
    };
  }, []);

  // Check for auto-connected wallets on mount
  useEffect(() => {
    const checkAutoConnectedWallets = async () => {
      // Only check on client side
      if (typeof window === 'undefined') return;

      try {
        // Check for MetaMask
        if ((window as any).ethereum) {
          let metamaskProvider: any = null;
          
          // Check if there are multiple providers
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
          } else if ((window as any).ethereum?.isMetaMask) {
            metamaskProvider = (window as any).ethereum;
          }

          if (metamaskProvider) {
            try {
              // Use eth_accounts (non-prompting) to check if already connected
              const accounts = await metamaskProvider.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                console.log('MetaMask auto-connected:', accounts[0]);
                setAutoConnectedMetaMask(accounts[0]);
              }
            } catch (error) {
              console.log('Could not check MetaMask auto-connection:', error);
            }
          }

          // NOTE: We intentionally do NOT check for Coinbase Wallet/Base auto-connection
          // Coinbase Wallet auto-connects on page load, but we don't want to acknowledge or use
          // that connection until the user explicitly clicks "Connect Base"
          // The connection logic in walletConnection.ts will handle checking if it's already connected
          // and will show an appropriate error message if the user needs to disconnect first
        }
      } catch (error) {
        console.error('Error checking auto-connected wallets:', error);
      }
    };

    checkAutoConnectedWallets();
  }, []);

  const clearAutoConnectedMetaMask = useCallback(() => {
    setAutoConnectedMetaMask(null);
  }, []);

  const clearAutoConnectedBase = useCallback(() => {
    setAutoConnectedBase(null);
  }, []);

  // Connect wallet function that handles entire connection flow
  const connectWallet = useCallback(async (walletType: WalletType): Promise<void> => {
    // Set connecting state
    if (walletType === 'metamask') {
      setIsConnectingMetaMask(true);
    } else {
      setIsConnectingBase(true);
    }

    try {
      if (!email) {
        throw new Error('Please sign in first to connect a wallet.');
      }

      console.log(`Requesting ${walletType} wallet connection...`);
      
      // Step 1: Connect to wallet
      const { accounts } = await connectWalletUtil(walletType);
      
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts found. Please approve the connection in ${walletType === 'metamask' ? 'MetaMask' : 'Base'}.`);
      }

      const walletAddress = accounts[0];
      console.log('Wallet address from request:', walletAddress);
      
      // IMMEDIATELY set connected state and store in localStorage so buttons update right away
      if (walletType === 'metamask') {
        localStorage.setItem('lastConnectedMetaMask', walletAddress);
        setConnectedMetaMask(true);
      } else {
        localStorage.setItem('lastConnectedBase', walletAddress);
        setConnectedBase(true);
      }
      console.log('Connected state set immediately for', walletType);
      
      // Reset connecting state
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
      
      // RELOAD IMMEDIATELY - don't wait for balance fetch or VavityAggregator
      console.log('RELOADING PAGE IMMEDIATELY after wallet connection!');
      if (typeof window !== 'undefined') {
        // Store wallet address and type for post-reload processing
        sessionStorage.setItem('pendingWalletAddress', walletAddress);
        sessionStorage.setItem('pendingWalletType', walletType);
        // Immediate reload - no delays
        window.location.reload();
        return; // Exit immediately
      }
      
      // This code won't execute due to reload, but keeping for structure
      // Process wallet in background after reload
      (async () => {
        try {
          // Step 2: Check if wallet is already connected
          const existingData = await fetchVavityAggregator(email);
          const existingWallets = existingData.wallets || [];
          const addressAlreadyConnected = existingWallets.some(
            (wallet: any) => wallet.address?.toLowerCase() === walletAddress.toLowerCase()
          );

          if (addressAlreadyConnected) {
            console.log('Wallet already connected in VavityAggregator');
            return;
          }

          // Step 3: Create wallet data (balance will be fetched by VavityAggregator)
          const currentVapa = Math.max(vapa || 0, assetPrice || 0);
          const currentAssetPrice = assetPrice || currentVapa;
          const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newCVactTaa = 0; // Balance will be fetched by VavityAggregator
          const newCpVact = currentVapa;
          const newCVact = newCVactTaa * newCpVact;
          const newCVatoi = newCVact;
          const newCpVatoi = currentAssetPrice;
          const newCdVatoi = newCVact - newCVatoi;
          
          const walletData = {
            walletId: walletId,
            address: walletAddress,
            cVatoi: newCVatoi,
            cpVatoi: newCpVatoi,
            cVact: newCVact,
            cpVact: newCpVact,
            cVactTaa: newCVactTaa,
            cdVatoi: newCdVatoi,
          };

          // Step 5: Add to VavityAggregator
          await addVavityAggregator(email, [walletData]);
          console.log('Wallet added to VavityAggregator in background');
        } catch (error) {
          console.error('Error processing wallet in background:', error);
        }
      })();
      
    } catch (error: any) {
      console.error('Error in connectWallet:', error);
      // Reset connecting state on error
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
      // Even on error, if we got the wallet address, try to reload
      const walletAddress = error?.walletAddress || (typeof window !== 'undefined' && localStorage.getItem(walletType === 'metamask' ? 'lastConnectedMetaMask' : 'lastConnectedBase'));
      if (walletAddress) {
        console.log('Error occurred but wallet was connected, reloading anyway...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
      throw error;
    }
  }, [email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator]);

  return (
    <WalletConnectionContext.Provider
      value={{
        autoConnectedMetaMask,
        autoConnectedBase,
        isConnectingMetaMask,
        isConnectingBase,
        connectedMetaMask,
        connectedBase,
        connectWallet,
        clearAutoConnectedMetaMask,
        clearAutoConnectedBase,
      }}
    >
      {children}
    </WalletConnectionContext.Provider>
  );
};

export const useWalletConnection = () => {
  const context = useContext(WalletConnectionContext);
  if (context === undefined) {
    throw new Error('useWalletConnection must be used within a WalletConnectionProvider');
  }
  return context;
};

