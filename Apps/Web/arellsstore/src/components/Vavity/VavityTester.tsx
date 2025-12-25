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
  
  // Force update counter to trigger re-render when cancellation happens
  const [forceUpdate, setForceUpdate] = useState(0);
  
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
  
  // Check backend JSON ONLY for pending wallets (to disable button even after reload)
  // This prevents double-clicks - if there's a pending wallet, button should be disabled
  // Backend JSON persists across browser sessions and page reloads
  const [hasPendingMetaMaskInBackend, setHasPendingMetaMaskInBackend] = useState(false);
  const [hasPendingBaseInBackend, setHasPendingBaseInBackend] = useState(false);
  
  // Track when we manually cleared state due to cancellation (to prevent checkPending from re-setting)
  const cancelledMetaMaskRef = useRef(false);
  const cancelledBaseRef = useRef(false);
  
  // Check if wallet extension is actually connected (has accounts)
  const [metaMaskExtensionConnected, setMetaMaskExtensionConnected] = useState(false);
  const [baseExtensionConnected, setBaseExtensionConnected] = useState(false);
  
  // Check for pending wallet/deposit on mount and show alert (ONLY from backend JSON)
  useEffect(() => {
    if (typeof window === 'undefined' || !email) return;
    
    const checkPendingOnMount = async () => {
      // ONLY check backend JSON for pending connections
      try {
        const response = await axios.get('/api/savePendingConnection', { params: { email } });
        const pendingConnections = response.data.pendingConnections || [];
        const now = Date.now();
        const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds
        
        // CRITICAL: Check for cancelled connections FIRST - before setting any flags
        // This ensures button state updates correctly when a deposit is cancelled
        const cancelledMetaMask = pendingConnections.find(
          (pc: any) => pc.walletType === 'metamask' && pc.depositCancelled === true
        );
        const cancelledBase = pendingConnections.find(
          (pc: any) => pc.walletType === 'base' && pc.depositCancelled === true
        );
        
        // DEBUG: Log cancellation detection
        console.log('[VavityTester checkPendingOnMount] Cancellation check:', {
          totalConnections: pendingConnections.length,
          cancelledMetaMask: !!cancelledMetaMask,
          cancelledBase: !!cancelledBase,
          cancelledMetaMaskData: cancelledMetaMask,
          cancelledBaseData: cancelledBase,
          allConnections: pendingConnections,
          metamaskConnections: pendingConnections.filter((pc: any) => pc.walletType === 'metamask'),
          baseConnections: pendingConnections.filter((pc: any) => pc.walletType === 'base')
        });
        
        // CRITICAL: If there's a cancelled connection, ALWAYS clear local state and backend flags
        // This ensures button updates immediately, regardless of other conditions
        // Do this BEFORE checking for active pending connections
        if (cancelledMetaMask) {
          console.log('[VavityTester] Detected cancelled MetaMask connection on mount, clearing all state');
          setPendingMetaMask(null);
          setHasPendingMetaMaskInBackend(false); // CRITICAL: Clear backend flag so button updates
        }
        if (cancelledBase) {
          console.log('[VavityTester] Detected cancelled Base connection on mount, clearing all state');
          setPendingBase(null);
          setHasPendingBaseInBackend(false); // CRITICAL: Clear backend flag so button updates
        }
        
        // Filter for active pending connections
        // CRITICAL: Include ALL pending connections that aren't cancelled/completed
        // Don't filter by timestamp - if it's in backend and not cancelled/completed, it's active
        const activePending = pendingConnections.filter((pc: any) => {
          if (pc.depositCancelled || pc.depositCompleted) return false;
          // Include all active pending connections (they're in backend for a reason)
          return true;
        });
        
        // Check if wallet extensions are connected
        let metamaskConnected = false;
        let baseConnected = false;
        
        if ((window as any).ethereum) {
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
              metamaskConnected = accounts && accounts.length > 0;
            } catch (e) {
              metamaskConnected = false;
            }
          }
          
          // Check Base
          let baseProvider: any = null;
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            baseProvider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            baseProvider = (window as any).ethereum;
          }
          
          if (baseProvider) {
            try {
              const accounts = await baseProvider.request({ method: 'eth_accounts' });
              baseConnected = accounts && accounts.length > 0;
            } catch (e) {
              baseConnected = false;
            }
          }
        }
        
        // Update button state based on backend JSON
        const pendingMetaMaskFromBackend = activePending.find((pc: any) => pc.walletType === 'metamask');
        const pendingBaseFromBackend = activePending.find((pc: any) => pc.walletType === 'base');
        
        const metamaskConnOnMount = pendingConnections.find((pc: any) => pc.walletType === 'metamask');
        const baseConnOnMount = pendingConnections.find((pc: any) => pc.walletType === 'base');
        
        // DEBUG: Log all connection details to understand what's happening
        console.log('[VavityTester checkPendingOnMount] Connection detection:', {
          totalConnections: pendingConnections.length,
          activePendingCount: activePending.length,
          activePending: activePending.map((pc: any) => ({
            address: pc.address,
            walletType: pc.walletType,
            depositCancelled: pc.depositCancelled,
            depositCompleted: pc.depositCompleted,
            txHash: pc.txHash
          })),
          pendingMetaMaskFromBackend: pendingMetaMaskFromBackend ? {
            address: pendingMetaMaskFromBackend.address,
            depositCancelled: pendingMetaMaskFromBackend.depositCancelled,
            depositCompleted: pendingMetaMaskFromBackend.depositCompleted
          } : null,
          pendingBaseFromBackend: pendingBaseFromBackend ? {
            address: pendingBaseFromBackend.address,
            depositCancelled: pendingBaseFromBackend.depositCancelled,
            depositCompleted: pendingBaseFromBackend.depositCompleted
          } : null,
          metamaskConnOnMount: metamaskConnOnMount ? {
            address: metamaskConnOnMount.address,
            depositCancelled: metamaskConnOnMount.depositCancelled,
            depositCompleted: metamaskConnOnMount.depositCompleted
          } : null,
          baseConnOnMount: baseConnOnMount ? {
            address: baseConnOnMount.address,
            depositCancelled: baseConnOnMount.depositCancelled,
            depositCompleted: baseConnOnMount.depositCompleted
          } : null
        });
        
        // CRITICAL: If cancelled connection exists, ALWAYS clear flag
        // ALSO: If connection exists but is NOT in activePending (filtered out = cancelled/completed), clear flag
        if (cancelledMetaMask) {
          console.log('[VavityTester checkPendingOnMount] Clearing hasPendingMetaMaskInBackend - cancelled found');
          setHasPendingMetaMaskInBackend(false);
        } else if (metamaskConnOnMount && !pendingMetaMaskFromBackend) {
          // Connection exists but filtered out (cancelled/completed) - clear flag
          console.log('[VavityTester checkPendingOnMount] Clearing hasPendingMetaMaskInBackend - connection exists but not active (cancelled/completed)');
          setHasPendingMetaMaskInBackend(false);
        } else {
          const shouldSetPending = !!pendingMetaMaskFromBackend;
          console.log('[VavityTester checkPendingOnMount] Setting hasPendingMetaMaskInBackend to:', shouldSetPending);
          setHasPendingMetaMaskInBackend(shouldSetPending);
        }
        
        if (cancelledBase) {
          console.log('[VavityTester checkPendingOnMount] Clearing hasPendingBaseInBackend - cancelled found');
          setHasPendingBaseInBackend(false);
        } else if (baseConnOnMount && !pendingBaseFromBackend) {
          // Connection exists but filtered out (cancelled/completed) - clear flag
          console.log('[VavityTester checkPendingOnMount] Clearing hasPendingBaseInBackend - connection exists but not active (cancelled/completed)');
          setHasPendingBaseInBackend(false);
        } else {
          const shouldSetPending = !!pendingBaseFromBackend;
          console.log('[VavityTester checkPendingOnMount] Setting hasPendingBaseInBackend to:', shouldSetPending);
          setHasPendingBaseInBackend(shouldSetPending);
        }
        
        // CRITICAL: Check for cancelled connections FIRST - if any exist, don't show alert
        const hasCancelledConnections = pendingConnections.some(
          (pc: any) => pc.depositCancelled === true
        );
        
        // Only show alert for MetaMask pending connections after reload
        // For Base/Coinbase wallet, NO alert - button will just change back
        if (!hasCancelledConnections && activePending.length > 0) {
          const shouldShowAlert = activePending.some((pc: any) => {
            // Double-check: skip if cancelled or completed (shouldn't be in activePending, but be safe)
            if (pc.depositCancelled || pc.depositCompleted) return false;
            // ONLY show alert for MetaMask - not for Base/Coinbase
            if (pc.walletType === 'metamask') {
              if (pc.txHash) return true; // Has transaction hash - deposit was initiated
              if (metamaskConnected) return true; // Recent and MetaMask connected
            }
            // Base/Coinbase wallet: no alert, just let button change back
            return false;
          });
          
          if (shouldShowAlert) {
            setTimeout(() => {
              alert('Check wallet - A transaction may be pending. Please check your wallet extension.');
            }, 1000); // Small delay to ensure page is loaded
          }
        }
      } catch (error) {
        console.error('[VavityTester] Error checking pending connections from backend:', error);
      }
    };
    
    checkPendingOnMount();
  }, [email]); // Run when email is available
  
  // Update pending state from backend JSON and check wallet extension connection
  // This effect runs on mount and whenever email changes
  useEffect(() => {
    const checkPending = async () => {
      if (typeof window !== 'undefined' && email) {
        // ONLY check backend JSON for pending connections
        try {
          const response = await axios.get('/api/savePendingConnection', { params: { email } });
          const pendingConnections = response.data.pendingConnections || [];
          const now = Date.now();
          const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds
          
          // CRITICAL: Check for cancelled connections FIRST - before setting any flags
          // This ensures button state updates correctly when a deposit is cancelled
          const cancelledMetaMask = pendingConnections.find(
            (pc: any) => pc.walletType === 'metamask' && pc.depositCancelled === true
          );
          const cancelledBase = pendingConnections.find(
            (pc: any) => pc.walletType === 'base' && pc.depositCancelled === true
          );
          
          // DEBUG: Log cancellation detection - show full connection details
          const metamaskConn = pendingConnections.find((pc: any) => pc.walletType === 'metamask');
          const baseConn = pendingConnections.find((pc: any) => pc.walletType === 'base');
          console.log('[VavityTester checkPending] Cancellation check:', {
            totalConnections: pendingConnections.length,
            cancelledMetaMask: !!cancelledMetaMask,
            cancelledBase: !!cancelledBase,
            metamaskConn: metamaskConn ? { address: metamaskConn.address, depositCancelled: metamaskConn.depositCancelled, depositCompleted: metamaskConn.depositCompleted } : null,
            baseConn: baseConn ? { address: baseConn.address, depositCancelled: baseConn.depositCancelled, depositCompleted: baseConn.depositCompleted } : null,
            allConnections: pendingConnections.map((pc: any) => ({ 
              address: pc.address, 
              walletType: pc.walletType, 
              depositCancelled: pc.depositCancelled, 
              depositCompleted: pc.depositCompleted,
              txHash: pc.txHash 
            }))
          });
          
          // CRITICAL: If cancelled connection exists in backend, clear backend flags
          // Button state comes ONLY from backend, so if backend says cancelled, button should not show pending
          if (cancelledMetaMask) {
            console.log('[VavityTester checkPending] Clearing hasPendingMetaMaskInBackend because cancelled');
            setHasPendingMetaMaskInBackend(false);
          }
          if (cancelledBase) {
            console.log('[VavityTester checkPending] Clearing hasPendingBaseInBackend because cancelled');
            setHasPendingBaseInBackend(false);
          }
          
          // Filter for active pending connections that are recent (within 10 minutes) or have a txHash
          // CRITICAL: Include ALL pending connections that aren't cancelled/completed
          // Don't filter by timestamp - if it's in backend and not cancelled/completed, it's active
          const activePending = pendingConnections.filter((pc: any) => {
            if (pc.depositCancelled || pc.depositCompleted) return false;
            // Include all active pending connections (they're in backend for a reason)
            return true;
          });
          
          const pendingMetaMaskFromBackend = activePending.find((pc: any) => pc.walletType === 'metamask');
          const pendingBaseFromBackend = activePending.find((pc: any) => pc.walletType === 'base');
          
          // Check for completed connections (should stay in JSON with depositCompleted: true)
          const completedMetaMask = pendingConnections.find(
            (pc: any) => pc.walletType === 'metamask' && pc.depositCompleted && !pc.depositCancelled
          );
          const completedBase = pendingConnections.find(
            (pc: any) => pc.walletType === 'base' && pc.depositCompleted && !pc.depositCancelled
          );
          
          // DEBUG: Log connection detection details
          console.log('[VavityTester checkPending] Connection detection:', {
            totalConnections: pendingConnections.length,
            activePendingCount: activePending.length,
            activePending: activePending.map((pc: any) => ({
              address: pc.address,
              walletType: pc.walletType,
              depositCancelled: pc.depositCancelled,
              depositCompleted: pc.depositCompleted,
              txHash: pc.txHash
            })),
            completedConnections: pendingConnections.filter((pc: any) => pc.depositCompleted && !pc.depositCancelled).map((pc: any) => ({
              address: pc.address,
              walletType: pc.walletType,
              depositCompleted: pc.depositCompleted,
              txHash: pc.txHash
            })),
            completedMetaMask: completedMetaMask ? {
              address: completedMetaMask.address,
              depositCompleted: completedMetaMask.depositCompleted,
              txHash: completedMetaMask.txHash
            } : null,
            completedBase: completedBase ? {
              address: completedBase.address,
              depositCompleted: completedBase.depositCompleted,
              txHash: completedBase.txHash
            } : null,
            pendingMetaMaskFromBackend: pendingMetaMaskFromBackend ? {
              address: pendingMetaMaskFromBackend.address,
              depositCancelled: pendingMetaMaskFromBackend.depositCancelled,
              depositCompleted: pendingMetaMaskFromBackend.depositCompleted
            } : null,
            pendingBaseFromBackend: pendingBaseFromBackend ? {
              address: pendingBaseFromBackend.address,
              depositCancelled: pendingBaseFromBackend.depositCancelled,
              depositCompleted: pendingBaseFromBackend.depositCompleted
            } : null
          });
          
          // CRITICAL: Button state comes ONLY from backend JSON
          // If cancelled connection exists, ALWAYS clear flag (even if there's also an active one)
          // This ensures button updates immediately when cancelled
          // ALSO: If there's a MetaMask connection but NO active pending (meaning it was cancelled and removed),
          // we should also clear the flag - the connection existing but not being active means it was cancelled
          if (cancelledMetaMask) {
            console.log('[VavityTester checkPending] Clearing hasPendingMetaMaskInBackend because cancelled connection found');
            setHasPendingMetaMaskInBackend(false);
          } else if (metamaskConn && !pendingMetaMaskFromBackend) {
            // Connection exists but is not in activePending - could be cancelled or completed
            // If it's completed, we should NOT set pending (correct), but connected state should be set by context
            // If it's cancelled, we should clear pending (correct)
            const isCompleted = metamaskConn.depositCompleted && !metamaskConn.depositCancelled;
            if (isCompleted) {
              console.log('[VavityTester checkPending] Connection is completed (not pending) - hasPendingMetaMaskInBackend should be false');
            } else {
              console.log('[VavityTester checkPending] Clearing hasPendingMetaMaskInBackend - connection exists but not active (likely cancelled)');
            }
            setHasPendingMetaMaskInBackend(false);
          } else {
            // Only set to true if there's an active pending connection AND no cancelled one
            const shouldSetPending = !!pendingMetaMaskFromBackend;
            console.log('[VavityTester checkPending] Setting hasPendingMetaMaskInBackend to:', shouldSetPending);
            setHasPendingMetaMaskInBackend(shouldSetPending);
          }
          
          if (cancelledBase) {
            console.log('[VavityTester checkPending] Clearing hasPendingBaseInBackend because cancelled connection found');
            setHasPendingBaseInBackend(false);
          } else if (baseConn && !pendingBaseFromBackend) {
            // Connection exists but is not in activePending - could be cancelled or completed
            // If it's completed, we should NOT set pending (correct), but connected state should be set by context
            // If it's cancelled, we should clear pending (correct)
            const isCompleted = baseConn.depositCompleted && !baseConn.depositCancelled;
            if (isCompleted) {
              console.log('[VavityTester checkPending] Connection is completed (not pending) - hasPendingBaseInBackend should be false');
            } else {
              console.log('[VavityTester checkPending] Clearing hasPendingBaseInBackend - connection exists but not active (likely cancelled)');
            }
            setHasPendingBaseInBackend(false);
          } else {
            // Only set to true if there's an active pending connection AND no cancelled one
            const shouldSetPending = !!pendingBaseFromBackend;
            console.log('[VavityTester checkPending] Setting hasPendingBaseInBackend to:', shouldSetPending);
            setHasPendingBaseInBackend(shouldSetPending);
          }
        } catch (error) {
          console.error('[VavityTester] Error fetching pending connections:', error);
        }
        
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
    // Check more frequently (every 500ms) to catch cancellations and new connections faster
    const interval = setInterval(checkPending, 500);
    return () => clearInterval(interval);
  }, [email]); // Re-run when email changes
  
  // REMOVED: No longer using React state (pendingMetaMask/pendingBase) for button state
  // Button state comes ONLY from backend JSON via hasPendingMetaMaskInBackend/hasPendingBaseInBackend

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

    // CRITICAL: Set connecting state immediately when button is clicked (shows "CONNECTING..." placeholder)
    if (walletType === 'metamask') {
      setIsConnectingMetaMask(true);
    } else {
      setIsConnectingBase(true);
    }

    // CRITICAL: Ensure JSON file exists when button is clicked (create if it doesn't exist)
    // This ensures the file structure is ready before we save any connections
    if (email) {
      try {
        // Check if file exists by making a GET request
        const response = await axios.get('/api/savePendingConnection', { params: { email } });
        const existingConnections = response.data.pendingConnections || [];
        
        // If file doesn't exist or is empty, create it by making a POST with a temporary connection
        // The API will create the file structure when we POST
        // We'll update this with the real connection data immediately after
        if (existingConnections.length === 0) {
          console.log('[VavityTester] JSON file doesn\'t exist, creating it...');
          // Create a temporary connection that will be updated with real data
          // Use a placeholder address that we'll replace when we get the real wallet address
          const tempAddress = '0x0000000000000000000000000000000000000000';
          const tempWalletId = `temp-init-${Date.now()}`;
          
          try {
            await axios.post('/api/savePendingConnection', {
              email,
              pendingConnection: {
                address: tempAddress,
                walletId: tempWalletId,
                walletType: walletType,
                timestamp: Date.now(),
                depositCancelled: false,
                depositCompleted: false,
              },
            });
            console.log('[VavityTester] JSON file created successfully');
            // The temporary connection will be replaced/updated when we save the real connection
            // The API filters by address+walletType, so the real connection will replace this one
          } catch (createError) {
            console.error('[VavityTester] Error creating JSON file:', createError);
            // Continue anyway - the file will be created when we save the first connection
          }
        } else {
          console.log('[VavityTester] JSON file already exists with', existingConnections.length, 'connections');
        }
      } catch (error: any) {
        // If GET fails, try to create the file anyway
        console.log('[VavityTester] Error checking JSON file, attempting to create it...', error?.message);
        try {
          const tempAddress = '0x0000000000000000000000000000000000000000';
          const tempWalletId = `temp-init-${Date.now()}`;
          await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: {
              address: tempAddress,
              walletId: tempWalletId,
              walletType: walletType,
              timestamp: Date.now(),
              depositCancelled: false,
              depositCompleted: false,
            },
          });
          console.log('[VavityTester] JSON file created after error check');
        } catch (createError) {
          console.error('[VavityTester] Error creating JSON file after error:', createError);
          // Continue anyway - the file will be created when we save the first connection
        }
      }
    }

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
          // Clear connecting state after successful deposit flow
          if (walletType === 'metamask') {
            setIsConnectingMetaMask(false);
          } else {
            setIsConnectingBase(false);
          }
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
          
          // If user cancelled, clear pending wallet state and return silently
          if (isCancelled) {
            console.log('User cancelled deposit in connectAssetForWallet, clearing pending wallet state');
            
            // Get wallet address before clearing state
            const walletAddress = walletType === 'metamask' ? pendingMetaMask?.address : pendingBase?.address;
            
            // Set cancellation flag to prevent auto-trigger on reload
            // Mark cancellation in backend JSON
            if (walletAddress && email) {
              try {
                await axios.post('/api/savePendingConnection', {
                  email,
                  pendingConnection: {
                    address: walletAddress,
                    walletId: walletId || '',
                    walletType: walletType,
                    timestamp: Date.now(),
                    depositCancelled: true,
                  },
                });
              } catch (error) {
                console.error('[VavityTester] Error marking cancellation in backend:', error);
              }
            }
            
            // Clear React state IMMEDIATELY - do this synchronously
            // Clear BOTH wallet types' state to be safe (in case of any cross-contamination)
            console.log('Clearing React state immediately...');
            
            // Clear context state first
            setPendingMetaMask(null);
            setPendingBase(null);
            
            // Clear local state (from backend JSON)
            setHasPendingMetaMaskInBackend(false);
            setHasPendingBaseInBackend(false);
            setIsConnectingMetaMask(false);
            setIsConnectingBase(false);
            setError(null);
            
            // Force a re-render by updating the forceUpdate counter
            setForceUpdate(prev => prev + 1);
            
            // Re-check backend JSON to ensure state is updated
            // Use requestAnimationFrame to ensure this happens after React's state updates
            requestAnimationFrame(async () => {
              if (email) {
                try {
                  const response = await axios.get('/api/savePendingConnection', { params: { email } });
                  const pendingConnections = response.data.pendingConnections || [];
                  const activePending = pendingConnections.filter(
                    (pc: any) => !pc.depositCancelled && !pc.depositCompleted
                  );
                  
                  const pendingMetaMask = activePending.find((pc: any) => pc.walletType === 'metamask');
                  const pendingBase = activePending.find((pc: any) => pc.walletType === 'base');
                  
                  setHasPendingMetaMaskInBackend(!!pendingMetaMask);
                  setHasPendingBaseInBackend(!!pendingBase);
                  
                  if (pendingMetaMask || pendingBase) {
                    console.warn('Backend JSON still has pending wallet after cancellation');
                  }
                  
                  // Clear state regardless
                  setHasPendingMetaMaskInBackend(false);
                  setHasPendingBaseInBackend(false);
                  setPendingMetaMask(null);
                  setPendingBase(null);
                } catch (error) {
                  console.error('[VavityTester] Error re-checking backend after cancellation:', error);
                }
              }
            });
            
            console.log('Pending wallet state cleared after cancellation. Backend JSON updated, state updated.');
            return;
          }
          // For other errors, show them
          setError(errorMsg);
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
        } else {
          setPendingBase(pendingWalletData);
        }
        
        // Save to backend JSON immediately (this is the source of truth)
        if (email) {
          try {
            // Check if wallet extension is actually connected
            let walletExtensionConnected = false;
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
                  walletExtensionConnected = accounts && accounts.length > 0 && 
                    accounts.some((acc: string) => acc.toLowerCase() === walletAddress.toLowerCase());
                } catch (e) {
                  walletExtensionConnected = false;
                }
              }
            }
            
            await axios.post('/api/savePendingConnection', {
              email,
              pendingConnection: {
                address: walletAddress,
                walletId,
                walletType,
                timestamp: Date.now(),
                depositCancelled: false,
                depositCompleted: false,
                walletExtensionConnected: walletExtensionConnected, // Track if wallet extension is connected
              },
            });
          } catch (error) {
            console.error('[VavityTester] Error saving pending connection to backend:', error);
          }
        }
        
        // Trigger deposit flow
        try {
          await connectAssetForWallet(walletType);
          // Clear connecting state after successful deposit flow
          if (walletType === 'metamask') {
            setIsConnectingMetaMask(false);
          } else {
            setIsConnectingBase(false);
          }
        } catch (depositError: any) {
          // Clear connecting state on error
          if (walletType === 'metamask') {
            setIsConnectingMetaMask(false);
          } else {
            setIsConnectingBase(false);
          }
          throw depositError; // Re-throw to be caught by outer catch
        }
        return;
      }

      // If wallet is fully connected (deposit confirmed), show success
      if (isFullyConnected && !pendingWallet) {
        setSuccess(`${walletType === 'metamask' ? 'MetaMask' : 'Base'} Ethereum asset is already connected!`);
        return;
      }

      // If wallet extension is not connected, connect it first (this will reload the page)
      // Note: Connecting state is already set at the beginning of this function
      if (!walletExtensionConnected) {
        console.log(`[Connect Asset] Wallet extension not connected, connecting wallet first...`);
        await connectAssetFromProvider(walletType);
        // Page will reload after connection, and deposit flow will trigger automatically
        return;
      }

    } catch (error: any) {
      console.error(`[Connect Asset] Error connecting ${walletType} asset:`, error);
      
      const errorMsg = String(error?.message || error?.toString() || '');
      
      // Check if this is the "already pending" error - if so, check if wallet is actually connected
      const isAlreadyPending = errorMsg.toLowerCase().includes('already pending') || 
                               errorMsg.toLowerCase().includes('wallet_requestPermissions');
      
      if (isAlreadyPending) {
        console.log(`[Connect Asset] "Already pending" error detected - checking if wallet is actually connected...`);
        
        // Check if wallet is actually connected now (the pending request might have completed)
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
                console.log(`[Connect Asset] Wallet is actually connected after "already pending" error:`, walletAddress);
              }
            } catch (e) {
              console.log(`[Connect Asset] Could not check ${walletType} connection after error:`, e);
            }
          }
        }
        
        // If wallet is connected, create pending wallet and trigger deposit
        if (walletExtensionConnected && walletAddress) {
          const isFullyConnected = walletType === 'metamask' ? connectedMetaMask : connectedBase;
          const pendingWallet = walletType === 'metamask' ? pendingMetaMask : pendingBase;
          
          console.log(`[Connect Asset] Wallet connected after "already pending" error, checking if we should trigger deposit...`, {
            isFullyConnected,
            hasPendingWallet: !!pendingWallet,
            walletAddress
          });
          
          // If not fully connected and no pending wallet, create one and trigger deposit
          if (!isFullyConnected && !pendingWallet) {
            console.log(`[Connect Asset] Creating pending wallet and triggering deposit after "already pending" error...`);
            
            // Create pending wallet info
            const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const pendingWalletData = { address: walletAddress, walletId };
            
            // Set pending wallet state
            if (walletType === 'metamask') {
              setPendingMetaMask(pendingWalletData);
            } else {
              setPendingBase(pendingWalletData);
            }
            
            // Save to backend JSON immediately
            if (email) {
              try {
                // Check if wallet extension is actually connected (we just verified it is)
                const walletExtensionConnected = true; // Since we just checked and it's connected
                
                await axios.post('/api/savePendingConnection', {
                  email,
                  pendingConnection: {
                    address: walletAddress,
                    walletId,
                    walletType,
                    timestamp: Date.now(),
                    depositCancelled: false,
                    depositCompleted: false,
                    walletExtensionConnected: walletExtensionConnected, // Track if wallet extension is connected
                  },
                });
                console.log(`[Connect Asset] Saved pending connection to backend after "already pending" error`);
              } catch (error) {
                console.error('[VavityTester] Error saving pending connection to backend:', error);
              }
            }
            
            // Trigger deposit flow
            try {
              await connectAssetForWallet(walletType);
              // Clear connecting state after successful deposit flow
              if (walletType === 'metamask') {
                setIsConnectingMetaMask(false);
              } else {
                setIsConnectingBase(false);
              }
              return; // Success - exit early
            } catch (depositError: any) {
              // Clear connecting state on error
              if (walletType === 'metamask') {
                setIsConnectingMetaMask(false);
              } else {
                setIsConnectingBase(false);
              }
              
              // Handle deposit cancellation/errors
              const depositErrorMsg = String(depositError?.message || depositError?.toString() || '');
              const isDepositCancelled = 
                depositErrorMsg.toLowerCase().includes('cancelled') || 
                depositErrorMsg.toLowerCase().includes('rejected') ||
                depositError?.code === 4001;
              
              if (isDepositCancelled) {
                console.log('[Connect Asset] User cancelled deposit after "already pending" error');
                // Clear state will be handled by the cancellation handler
                return;
              }
              // Re-throw other deposit errors
              throw depositError;
            }
          }
        }
        
        // Show the "already pending" error message
        setError(errorMsg);
        // Clear connecting state since we're showing an error
        if (walletType === 'metamask') {
          setIsConnectingMetaMask(false);
        } else {
          setIsConnectingBase(false);
        }
        return;
      }
      
      // Check if this is a cancellation error - don't show error for cancellations
      const isCancelled = 
        errorMsg.toLowerCase().includes('cancelled') || 
        errorMsg.toLowerCase().includes('rejected') || 
        errorMsg.toLowerCase().includes('user rejected') ||
        errorMsg.toLowerCase().includes('user rejected the request') ||
        errorMsg.toLowerCase().includes('action rejected') ||
        error?.code === 4001 ||
        error?.code === 'ACTION_REJECTED';
      
      if (isCancelled) {
        // User cancelled - clear all state immediately
        console.log('[Connect Asset] User cancelled, clearing all state');
        
        // Get wallet address before clearing
        const walletAddress = walletType === 'metamask' ? pendingMetaMask?.address : pendingBase?.address;
        
        // Mark cancellation in backend JSON
        if (walletAddress && email) {
          try {
            await axios.post('/api/savePendingConnection', {
              email,
              pendingConnection: {
                address: walletAddress,
                walletId: walletId || '',
                walletType: walletType,
                timestamp: Date.now(),
                depositCancelled: true,
              },
            });
          } catch (error) {
            console.error('[VavityTester] Error marking cancellation in backend:', error);
          }
        }
        
        // Clear React state IMMEDIATELY
        setPendingMetaMask(null);
        setPendingBase(null);
        setHasPendingMetaMaskInBackend(false);
        setHasPendingBaseInBackend(false);
        setIsConnectingMetaMask(false);
        setIsConnectingBase(false);
        setError(null);
        
        // Force immediate re-check from backend JSON
        requestAnimationFrame(async () => {
          if (email) {
            try {
              const response = await axios.get('/api/savePendingConnection', { params: { email } });
              const pendingConnections = response.data.pendingConnections || [];
              const activePending = pendingConnections.filter(
                (pc: any) => !pc.depositCancelled && !pc.depositCompleted
              );
              
              const pendingMetaMask = activePending.find((pc: any) => pc.walletType === 'metamask');
              const pendingBase = activePending.find((pc: any) => pc.walletType === 'base');
              
              setHasPendingMetaMaskInBackend(!!pendingMetaMask);
              setHasPendingBaseInBackend(!!pendingBase);
              if (!pendingMetaMask) setPendingMetaMask(null);
              if (!pendingBase) setPendingBase(null);
            } catch (error) {
              console.error('[VavityTester] Error re-checking backend after cancellation:', error);
            }
          }
        });
        
        console.log('[Connect Asset] State cleared after cancellation');
        return;
      }
      
      // For other errors, show them
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
                disabled={(connectedMetaMask && !hasPendingMetaMaskInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingMetaMaskInBackend}
                style={{
                  padding: '15px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: connectedMetaMask && !hasPendingMetaMaskInBackend ? '#28a745' : 
                                   (hasPendingMetaMaskInBackend && metaMaskExtensionConnected) ? '#ffc107' :
                                   hasPendingMetaMaskInBackend ? '#ccc' :
                                   (email && !isConnectingMetaMask && !isConnectingBase && !connectedMetaMask && !hasPendingMetaMaskInBackend) ? '#f6851b' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: ((connectedMetaMask && !hasPendingMetaMaskInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingMetaMaskInBackend) ? 'not-allowed' : 'pointer',
                  opacity: ((connectedMetaMask && !hasPendingMetaMaskInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingMetaMaskInBackend) ? (connectedMetaMask ? 1 : 0.6) : 1,
                  pointerEvents: ((connectedMetaMask && !hasPendingMetaMaskInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingMetaMaskInBackend) ? 'none' : 'auto',
                }}
              >
                {(() => {
                  // CRITICAL: Button state comes ONLY from backend JSON, not React state
                  // hasPendingMetaMaskInBackend is the single source of truth
                  const isPending = hasPendingMetaMaskInBackend;
                  
                  let buttonText: string;
                  if (connectedMetaMask && !isPending) {
                    buttonText = 'CONNECTED TO METAMASK';
                  } else if (isPending) {
                    buttonText = 'WAITING FOR DEPOSIT...';
                  } else if (isConnectingMetaMask) {
                    buttonText = 'CONNECTING...';
                  } else {
                    buttonText = 'CONNECT ETHEREUM WITH METAMASK';
                  }
                  
                  // DEBUG: Only log when button should show "WAITING FOR DEPOSIT" but might not be
                  if (isPending && buttonText !== 'WAITING FOR DEPOSIT...') {
                    console.warn('[VavityTester] Button state mismatch:', { isPending, buttonText, hasPendingMetaMaskInBackend, connectedMetaMask, isConnectingMetaMask });
                  }
                  
                  return buttonText;
                })()}
              </button>
          <button
                onClick={handleConnectBase}
                disabled={(connectedBase && !hasPendingBaseInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingBaseInBackend}
          style={{
                  padding: '15px 20px',
            fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: connectedBase && !hasPendingBaseInBackend ? '#28a745' : 
                                   (hasPendingBaseInBackend && baseExtensionConnected) ? '#ffc107' :
                                   hasPendingBaseInBackend ? '#ccc' :
                                   (email && !isConnectingMetaMask && !isConnectingBase && !connectedBase && !hasPendingBaseInBackend) ? '#0052ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
                  cursor: ((connectedBase && !hasPendingBaseInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingBaseInBackend) ? 'not-allowed' : 'pointer',
                  opacity: ((connectedBase && !hasPendingBaseInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingBaseInBackend) ? (connectedBase ? 1 : 0.6) : 1,
                  pointerEvents: ((connectedBase && !hasPendingBaseInBackend) || isConnectingMetaMask || isConnectingBase || !email || hasPendingBaseInBackend) ? 'none' : 'auto',
          }}
        >
                {(() => {
                  // CRITICAL: Button state comes ONLY from backend JSON, not React state
                  const isPending = hasPendingBaseInBackend;
                  
                  if (connectedBase && !isPending) {
                    return 'CONNECTED TO BASE';
                  } else if (isPending) {
                    return 'WAITING FOR DEPOSIT...';
                  } else if (isConnectingBase) {
                    return 'CONNECTING...';
                  } else {
                    return 'CONNECT ETHEREUM WITH BASE';
                  }
                })()}
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