'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVavity } from '../../context/VavityAggregator';
import { useAssetConnect } from '../../context/AssetConnectContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { WalletType } from '../../utils/walletConnection';

interface WalletData {
  walletId: string;
  address: string;
  // Private key is NOT stored, only displayed once after creation
  cVatoc: number;
  cpVatoc: number;
  cVact: number;
  cpVact: number;
  cVactTaa: number;
  cdVatoc: number;
}

interface VavityCombinations {
  acVatoc: number;
  acdVatoc: number;
  acVact: number;
  acVactTaa: number;
}

const VavityTester: React.FC = () => {
  const {
    assetPrice,
    vapa,
    email,
    fetchVavityAggregator,
    addVavityAggregator,
    saveVavityAggregator,
  } = useVavity();

  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [vavityCombinations, setVavityCombinations] = useState<VavityCombinations>({
    acVatoc: 0,
    acdVatoc: 0,
    acVact: 0,
    acVactTaa: 0,
  });
  const [localVapa, setLocalVapa] = useState<number>(0);
  const [newlyConnectedWallet, setNewlyConnectedWallet] = useState<{ address: string; balance: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Connect Wallet state
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  
  // Track previous connection states to detect when a wallet becomes connected
  const prevConnectedMetaMaskRef = useRef<boolean>(false);
  const prevConnectedBaseRef = useRef<boolean>(false);
  
  // Get wallet connection from provider
  const { 
    connectAsset: connectAssetFromProvider, 
    isConnectingMetaMask, 
    isConnectingBase, 
    connectedMetaMask, 
    connectedBase,
    pendingMetaMask,
    pendingBase,
    connectAssetForWallet,
    setPendingMetaMask,
    setPendingBase,
    setIsConnectingMetaMask,
    setIsConnectingBase
  } = useAssetConnect();
  
  // Check sessionStorage for pending wallets (to disable button even after reload)
  // This prevents double-clicks - if there's a pending wallet, button should be disabled
  const [hasPendingMetaMaskInStorage, setHasPendingMetaMaskInStorage] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('pendingMetaMask');
    }
    return false;
  });
  const [hasPendingBaseInStorage, setHasPendingBaseInStorage] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('pendingBase');
    }
    return false;
  });
  
  // Check if wallet extension is actually connected (has accounts)
  const [metaMaskExtensionConnected, setMetaMaskExtensionConnected] = useState(false);
  const [baseExtensionConnected, setBaseExtensionConnected] = useState(false);
  
  // Update pending state from sessionStorage and check wallet extension connection
  useEffect(() => {
    const checkPending = async () => {
      if (typeof window !== 'undefined') {
        setHasPendingMetaMaskInStorage(!!sessionStorage.getItem('pendingMetaMask'));
        setHasPendingBaseInStorage(!!sessionStorage.getItem('pendingBase'));
        
        // Check if MetaMask extension is connected
        if ((window as any).ethereum) {
          let metamaskProvider: any = null;
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
          } else if ((window as any).ethereum?.isMetaMask) {
            metamaskProvider = (window as any).ethereum;
          }
          
          if (metamaskProvider) {
            try {
              const accounts = await metamaskProvider.request({ method: 'eth_accounts' });
              setMetaMaskExtensionConnected(accounts && accounts.length > 0);
            } catch (e) {
              setMetaMaskExtensionConnected(false);
            }
          } else {
            setMetaMaskExtensionConnected(false);
          }
          
          // Check if Base extension is connected
          let baseProvider: any = null;
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            baseProvider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            baseProvider = (window as any).ethereum;
          }
          
          if (baseProvider) {
            try {
              const accounts = await baseProvider.request({ method: 'eth_accounts' });
              setBaseExtensionConnected(accounts && accounts.length > 0);
            } catch (e) {
              setBaseExtensionConnected(false);
            }
          } else {
            setBaseExtensionConnected(false);
          }
        }
      }
    };
    
    checkPending();
    const interval = setInterval(checkPending, 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateCombinations = (walletList: WalletData[]): VavityCombinations => {
    return walletList.reduce(
      (acc, wallet) => {
        acc.acVatoc += wallet.cVatoc || 0;
        acc.acVact += wallet.cVact || 0;
        acc.acdVatoc += wallet.cdVatoc || 0;
        acc.acVactTaa += wallet.cVactTaa || 0;
        return acc;
      },
      {
        acVatoc: 0,
        acVact: 0,
        acdVatoc: 0,
        acVactTaa: 0,
      }
    );
  };

  const calculateVapa = (walletList: WalletData[]): number => {
    if (walletList.length === 0) return assetPrice || 0;
    const maxCpVact = Math.max(...walletList.map(w => w.cpVact || 0));
    return Math.max(maxCpVact, assetPrice || 0);
  };

  // Sync wallet balances from blockchain
  const syncWalletBalances = useCallback(async () => {
    if (wallets.length === 0 || !email) {
      console.log('[Sync] Skipping - no wallets or email');
      return;
    }

    console.log('[Sync] Starting balance sync for', wallets.length, 'wallets');

    try {
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            // Fetch balance from blockchain
                   const res = await fetch(`/api/ethBalance?address=${wallet.address}`);
            if (!res.ok) {
              console.error(`[Sync] Failed to fetch balance for ${wallet.address}:`, res.status);
              return wallet;
            }
                   const balanceData = await res.json();
                   const balanceInBTC = parseFloat(balanceData.balance);
            
                   console.log(`[Sync] Wallet ${wallet.address}: ${balanceInBTC} BTC`);

            const currentVapa = Math.max(vapa || 0, assetPrice || 0, localVapa || 0);
            const previousCVactTaa = wallet.cVactTaa || 0;
            const newCVactTaa = balanceInBTC;

            // If balance changed from 0 to a value, initialize cpVatoc and cpVact
            if (previousCVactTaa === 0 && newCVactTaa > 0) {
              // First time assets detected - set cpVatoc and cpVact to current VAPA
              const newCpVatoc = currentVapa;
              const newCpVact = currentVapa;
              const newCVact = newCVactTaa * newCpVact;
              const newCVatoc = newCVact; // cVatoc equals cVact at connect time
              const newCdVatoc = newCVact - newCVatoc; // Should be 0 at connect

              return {
                ...wallet,
                cVactTaa: newCVactTaa,
                cpVatoc: newCpVatoc,
                cpVact: newCpVact,
                cVact: newCVact,
                cVatoc: newCVatoc,
                cdVatoc: newCdVatoc,
              };
            } else if (newCVactTaa !== previousCVactTaa) {
              // Balance changed - recalculate values
              const currentCpVact = wallet.cpVact || 0;
              const newCVact = newCVactTaa * currentCpVact;
              const newCdVatoc = newCVact - (wallet.cVatoc || 0);

              return {
                ...wallet,
                cVactTaa: newCVactTaa,
                cVact: newCVact,
                cdVatoc: newCdVatoc,
                // cpVatoc and cVatoc don't change after connect
                cpVatoc: wallet.cpVatoc || 0,
                cVatoc: wallet.cVatoc || 0,
              };
            }

            // No change in balance
            return wallet;
          } catch (error) {
            console.error(`Error fetching balance for wallet ${wallet.address}:`, error);
            return wallet; // Return unchanged wallet on error
          }
        })
      );

      // Check if any wallet was updated
      const hasChanges = updatedWallets.some((w, i) => {
        const old = wallets[i];
        return (w.cVactTaa || 0) !== (old.cVactTaa || 0);
      });

      if (hasChanges) {
        const newCombinations = calculateCombinations(updatedWallets);
        setWallets(updatedWallets);
        setVavityCombinations(newCombinations);
        
        // Save to backend
        await saveVavityAggregator(email, updatedWallets, newCombinations);
      }
    } catch (error) {
      console.error('Error syncing wallet balances:', error);
    }
  }, [wallets, email, vapa, assetPrice, localVapa, saveVavityAggregator]);

  // Initialize refs with current connection states on mount
  useEffect(() => {
    prevConnectedMetaMaskRef.current = connectedMetaMask;
    prevConnectedBaseRef.current = connectedBase;
  }, []); // Only run once on mount

  // Fetch existing wallets on mount
  useEffect(() => {
    if (email) {
      loadWallets();
    }
  }, [email]);

  // Refetch wallets when a wallet connection is successfully completed (after deposit)
  // Only trigger when transitioning from false to true (new connection)
  useEffect(() => {
    if (!email) return;
    
    const metaMaskJustConnected = connectedMetaMask && !prevConnectedMetaMaskRef.current;
    const baseJustConnected = connectedBase && !prevConnectedBaseRef.current;
    
    if (metaMaskJustConnected || baseJustConnected) {
      console.log('[VavityTester] Wallet connection detected, refetching wallets...', {
        metaMaskJustConnected,
        baseJustConnected
      });
      // Add a small delay to ensure backend has saved the wallet data
      const timeoutId = setTimeout(() => {
        loadWallets();
      }, 1000);
      
      // Update refs
      prevConnectedMetaMaskRef.current = connectedMetaMask;
      prevConnectedBaseRef.current = connectedBase;
      
      return () => clearTimeout(timeoutId);
    } else {
      // Update refs even if not triggering refetch
      prevConnectedMetaMaskRef.current = connectedMetaMask;
      prevConnectedBaseRef.current = connectedBase;
    }
  }, [connectedMetaMask, connectedBase, email]);

  // Sync wallet balances periodically
  useEffect(() => {
    if (wallets.length === 0 || !email) return;

    // Sync immediately after wallets load
    const timeoutId = setTimeout(() => {
      syncWalletBalances();
    }, 2000); // Wait 2 seconds after wallets load

    // Then sync every 30 seconds
    const interval = setInterval(() => {
      syncWalletBalances();
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [wallets.length, email, syncWalletBalances]); // Re-run when wallets are added/removed or email changes

  // Update wallets' cpVact when VAPA increases
  // Only update wallets that have assets (cVactTaa > 0)
  useEffect(() => {
    if (wallets.length === 0 || !email) return;

    const currentVapa = Math.max(vapa || 0, assetPrice || 0, localVapa || 0);
    
    // Check if any wallet with assets (cVactTaa > 0) needs cpVact updating
    const needsUpdate = wallets.some(w => {
      const hasAssets = (w.cVactTaa || 0) > 0;
      const walletCpVact = w.cpVact || 0;
      return hasAssets && walletCpVact < currentVapa;
    });
    
    if (needsUpdate && currentVapa > 0) {
      const updatedWallets = wallets.map(wallet => {
        // Only update wallets that have assets (cVactTaa > 0)
        if ((wallet.cVactTaa || 0) === 0) {
          return wallet; // Keep wallet unchanged if no assets
        }
        
        const newCpVact = Math.max(wallet.cpVact || 0, currentVapa);
        // Recalculate cVact based on new cpVact
        const newCVact = parseFloat(((wallet.cVactTaa || 0) * newCpVact).toFixed(2));
        // Recalculate cdVatoc
        const newCdVatoc = parseFloat((newCVact - (wallet.cVatoc || 0)).toFixed(2));
        
        return {
          ...wallet,
          cpVact: newCpVact,
          cVact: newCVact,
          cdVatoc: newCdVatoc,
        };
      });

      // Calculate new combinations
      const newCombinations = calculateCombinations(updatedWallets);
      const newVapa = Math.max(...updatedWallets.map(w => w.cpVact || 0), currentVapa);

      // Update local state
      setWallets(updatedWallets);
      setVavityCombinations(newCombinations);
      setLocalVapa(newVapa);

      // Save to backend
      saveVavityAggregator(email, updatedWallets, newCombinations).catch(err => {
        console.error('Error saving updated wallets:', err);
      });
    }
  }, [vapa, assetPrice]);

  const loadWallets = async () => {
    try {
      const data = await fetchVavityAggregator(email);
      if (data.wallets) {
        setWallets(data.wallets);
      }
      if (data.vavityCombinations) {
        setVavityCombinations(data.vavityCombinations);
      }
      if (data.vapa) {
        setLocalVapa(data.vapa);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  // Unified connect asset handler: checks wallet connection, connects if needed, then triggers deposit
  const handleConnectAsset = async (walletType: WalletType) => {
    setError(null);
    setSuccess(null);
    setConnectedAddress(''); // Clear previous address

    try {
      // Check if wallet extension is already connected
      let walletExtensionConnected = false;
      let walletAddress: string | null = null;
      
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        let provider: any = null;
        if (walletType === 'metamask') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
          } else if ((window as any).ethereum?.isMetaMask) {
            provider = (window as any).ethereum;
          }
        } else if (walletType === 'base') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            provider = (window as any).ethereum;
          }
        }
        
        if (provider) {
          try {
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              walletExtensionConnected = true;
              walletAddress = accounts[0];
            }
          } catch (error) {
            console.log(`[Connect Asset] Could not check ${walletType} connection:`, error);
          }
        }
      }
      
      // Check state
      const isFullyConnected = walletType === 'metamask' ? connectedMetaMask : connectedBase;
      const pendingWallet = walletType === 'metamask' ? pendingMetaMask : pendingBase;
      const lastConnectedAddress = localStorage.getItem(walletType === 'metamask' ? 'lastConnectedMetaMask' : 'lastConnectedBase');

      console.log(`[Connect Asset] State check:`, {
        walletType,
        walletExtensionConnected,
        walletAddress,
        isFullyConnected,
        hasPendingWallet: !!pendingWallet,
        lastConnectedAddress
      });

      // If wallet extension is connected and has pending wallet, trigger deposit flow
      if (walletExtensionConnected && pendingWallet) {
        console.log(`[Connect Asset] Wallet extension connected with pending deposit, triggering deposit flow...`);
        try {
          await connectAssetForWallet(walletType);
        } catch (error: any) {
          // Check for cancellation errors (various formats)
          const errorMsg = String(error?.message || error?.toString() || '');
          const isCancelled = 
            errorMsg.toLowerCase().includes('cancelled') || 
            errorMsg.toLowerCase().includes('rejected') || 
            errorMsg.toLowerCase().includes('user rejected') ||
            errorMsg.toLowerCase().includes('user rejected the request') ||
            errorMsg.toLowerCase().includes('action rejected') ||
            error?.code === 4001 ||
            error?.code === 'ACTION_REJECTED';
          
          // If user cancelled, don't show error - just return silently
          if (isCancelled) {
            console.log('User cancelled deposit in connectAssetForWallet');
            return;
          }
          // For other errors, show them
          throw error;
        }
        return;
      }

      // If wallet extension is connected but no pending wallet and not fully connected, create pending wallet
      if (walletExtensionConnected && !pendingWallet && !isFullyConnected && walletAddress) {
        console.log(`[Connect Asset] Wallet extension connected but no pending wallet, creating pending wallet...`);
        // Create pending wallet info
        const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const pendingWalletData = { address: walletAddress, walletId };
        
        // Set pending wallet state immediately so button shows "WAITING FOR DEPOSIT..."
        if (walletType === 'metamask') {
          setPendingMetaMask(pendingWalletData);
          sessionStorage.setItem('pendingMetaMask', JSON.stringify(pendingWalletData));
        } else {
          setPendingBase(pendingWalletData);
          sessionStorage.setItem('pendingBase', JSON.stringify(pendingWalletData));
        }
        
        sessionStorage.setItem('pendingWalletAddress', walletAddress);
        sessionStorage.setItem('pendingWalletType', walletType);
        sessionStorage.setItem('pendingWalletId', walletId);
        
        // Trigger deposit flow
        await connectAssetForWallet(walletType);
        return;
      }

      // If wallet is fully connected (deposit confirmed), show success
      if (isFullyConnected && !pendingWallet) {
        setSuccess(`${walletType === 'metamask' ? 'MetaMask' : 'Base'} Ethereum asset is already connected!`);
        return;
      }

      // If wallet extension is not connected, connect it first (this will reload the page)
      if (!walletExtensionConnected) {
        console.log(`[Connect Asset] Wallet extension not connected, connecting wallet first...`);
        // Set connecting state immediately to disable button
        if (walletType === 'metamask') {
          setIsConnectingMetaMask(true);
        } else {
          setIsConnectingBase(true);
        }
        await connectAssetFromProvider(walletType);
        // Page will reload after connection, and deposit flow will trigger automatically
        return;
      }

    } catch (error: any) {
      console.error(`[Connect Asset] Error connecting ${walletType} asset:`, error);
      const errorMessage = error?.response?.data?.error || error?.message || `Failed to connect ${walletType === 'metamask' ? 'MetaMask' : 'Base'} Ethereum asset. Please try again.`;
      setError(errorMessage);
      setConnectedAddress(''); // Clear address on error
      // Reset connecting state on error
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
    }
  };

  const handleConnectMetaMask = async () => {
    await handleConnectAsset('metamask');
  };

  const handleConnectBase = async () => {
    await handleConnectAsset('base');
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    const roundedValue = Math.max(0, value);
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatPrice = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    const roundedValue = Math.max(0, value);
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00000000';
    }
    return value.toFixed(8);
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Vavity Tester</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <p><strong>Email:</strong> {email || 'Not signed in'}</p>
        </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={handleConnectMetaMask}
                disabled={(connectedMetaMask && !pendingMetaMask && !hasPendingMetaMaskInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected)}
                style={{
                  padding: '15px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: connectedMetaMask && !pendingMetaMask && !hasPendingMetaMaskInStorage ? '#28a745' : 
                                   ((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected) ? '#ffc107' :
                                   (email && !isConnectingMetaMask && !isConnectingBase && !connectedMetaMask && !((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected)) ? '#f6851b' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: ((connectedMetaMask && !pendingMetaMask && !hasPendingMetaMaskInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected)) ? 'not-allowed' : 'pointer',
                  opacity: ((connectedMetaMask && !pendingMetaMask && !hasPendingMetaMaskInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected)) ? (connectedMetaMask ? 1 : 0.6) : 1,
                  pointerEvents: ((connectedMetaMask && !pendingMetaMask && !hasPendingMetaMaskInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected)) ? 'none' : 'auto',
                }}
              >
                {connectedMetaMask && !pendingMetaMask && !hasPendingMetaMaskInStorage ? 'CONNECTED TO METAMASK' : 
                 ((hasPendingMetaMaskInStorage || pendingMetaMask) && metaMaskExtensionConnected) ? 'WAITING FOR DEPOSIT...' :
                 isConnectingMetaMask ? 'CONNECTING...' : 
                 'CONNECT ETHEREUM WITH METAMASK'}
              </button>
          <button
                onClick={handleConnectBase}
                disabled={(connectedBase && !pendingBase && !hasPendingBaseInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected)}
          style={{
                  padding: '15px 20px',
            fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: connectedBase && !pendingBase && !hasPendingBaseInStorage ? '#28a745' : 
                                   ((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected) ? '#ffc107' :
                                   (email && !isConnectingMetaMask && !isConnectingBase && !connectedBase && !((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected)) ? '#0052ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
                  cursor: ((connectedBase && !pendingBase && !hasPendingBaseInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected)) ? 'not-allowed' : 'pointer',
                  opacity: ((connectedBase && !pendingBase && !hasPendingBaseInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected)) ? (connectedBase ? 1 : 0.6) : 1,
                  pointerEvents: ((connectedBase && !pendingBase && !hasPendingBaseInStorage) || isConnectingMetaMask || isConnectingBase || !email || ((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected)) ? 'none' : 'auto',
          }}
        >
                {connectedBase && !pendingBase && !hasPendingBaseInStorage ? 'CONNECTED TO BASE' : 
                 ((hasPendingBaseInStorage || pendingBase) && baseExtensionConnected) ? 'WAITING FOR DEPOSIT...' :
                 isConnectingBase ? 'CONNECTING...' : 
                 'CONNECT ETHEREUM WITH BASE'}
        </button>
            </div>
            {connectedAddress && !isConnectingMetaMask && !isConnectingBase && (
              <div style={{
                padding: '10px',
                marginTop: '10px',
                backgroundColor: '#fff3cd',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                textAlign: 'center',
                border: '1px solid #ffc107',
              }}>
                <strong>Note:</strong> This is an Ethereum address (0x...) from {connectedAddress.startsWith('0x') ? 'MetaMask/Base wallet' : 'wallet'}.<br/>
                Connected: {connectedAddress}
              </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              <p>Status: MetaMask={String(isConnectingMetaMask)}, Base={String(isConnectingBase)}, email={email ? '✓' : '✗'}</p>
              <p>Connected: MetaMask={String(connectedMetaMask)}, Base={String(connectedBase)}</p>
              <p>Buttons enabled: {(!isConnectingMetaMask && !isConnectingBase && email && !connectedMetaMask && !connectedBase) ? 'YES' : 'NO'}</p>
            </div>
          </div>
        {error && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '5px',
          }}>
            {success}
          </div>
        )}
      </div>

      {newlyConnectedWallet && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #28a745',
          borderRadius: '5px',
        }}>
          <h3>✅ Wallet Connected Successfully!</h3>
          <p><strong>Address:</strong> {newlyConnectedWallet.address}</p>
                <p><strong>Balance:</strong> {newlyConnectedWallet.balance.toFixed(6)} BTC</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Your wallet balance has been added to VavityAggregator.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>External Ethereum Price: ${formatPrice(assetPrice || 0)}</h2>
        <h3>Internal Ethereum Price (VAPA): ${formatPrice(Math.max(vapa || 0, localVapa || 0, assetPrice || 0))}</h3>
      </div>

      {wallets.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>Wallets:</h2>
          {wallets.map((wallet, index) => (
            <div key={wallet.walletId} style={{
              marginBottom: '20px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '5px',
            }}>
              <h3>Wallet ID {index + 1}:</h3>
              <p><strong>Address:</strong> {wallet.address}</p>
              <p>cVatoc = ${formatCurrency(wallet.cVatoc)}, cpVatoc = ${formatPrice(wallet.cpVatoc)}, cVact = ${formatCurrency(wallet.cVact)}, cpVact = ${formatPrice(wallet.cpVact)}.</p>
              <p>cVactTaa = {formatNumber(wallet.cVactTaa)}, cdVatoc = ${formatCurrency(wallet.cdVatoc)}.</p>
            </div>
          ))}
        </div>
      )}

      {wallets.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
        }}>
          <h2>Wallet Totals:</h2>
          <p>acVatoc = ${formatCurrency(vavityCombinations.acVatoc)} ({wallets.map(w => `$${formatCurrency(w.cVatoc)}`).join(' + ')})</p>
          <p>acdVatoc = ${formatCurrency(vavityCombinations.acdVatoc)} ({wallets.map(w => `$${formatCurrency(w.cdVatoc)}`).join(' + ')})</p>
          <p>acVact = ${formatCurrency(vavityCombinations.acVact)} ({wallets.map(w => `$${formatCurrency(w.cVact)}`).join(' + ')})</p>
          <p>acVactTaa = {formatNumber(vavityCombinations.acVactTaa)} ({wallets.map(w => formatNumber(w.cVactTaa)).join(' + ')})</p>
        </div>
      )}

      {wallets.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>No wallets connected yet. Click "Connect Wallet" to connect your MetaMask or Base wallet.</p>
        </div>
      )}
    </div>
  );
};

export default VavityTester;
