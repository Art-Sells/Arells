'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { connectWallet as connectWalletUtil, WalletType } from '../utils/walletConnection';
import { useVavity } from './VavityAggregator';
import { completeDepositFlow, calculateDepositAmount } from '../utils/depositTransaction';
import { connectAsset as connectAssetUtil } from '../utils/connectAsset';
import { checkExistingDepositTransaction, verifyTransactionExists } from '../utils/checkDepositTransaction';

interface AssetConnectContextType {
  // Auto-connected wallets (detected on page load)
  autoConnectedMetaMask: string | null;
  autoConnectedBase: string | null;
  
  // Currently connecting state
  isConnectingMetaMask: boolean;
  isConnectingBase: boolean;
  
  // Connected wallets state (after successful connection AND deposit confirmation)
  connectedMetaMask: boolean;
  connectedBase: boolean;
  
  // Pending wallets that need deposit (wallet connected but deposit not confirmed)
  pendingMetaMask: { address: string; walletId: string } | null;
  pendingBase: { address: string; walletId: string } | null;
  
  // Connect Asset: Handles wallet connection, deposit, and fetches balances
  connectAsset: (walletType: WalletType) => Promise<void>;
  
  // Connect Asset for pending wallet: Handles deposit and fetches balances for pending wallet
  connectAssetForWallet: (walletType: WalletType) => Promise<void>;
  
  // Clear auto-connected wallets (when user disconnects)
  clearAutoConnectedMetaMask: () => void;
  clearAutoConnectedBase: () => void;
  
  // Setters for pending wallets and connecting state
  setPendingMetaMask: (wallet: { address: string; walletId: string } | null) => void;
  setPendingBase: (wallet: { address: string; walletId: string } | null) => void;
  setIsConnectingMetaMask: (isConnecting: boolean) => void;
  setIsConnectingBase: (isConnecting: boolean) => void;
}

const AssetConnectContext = createContext<AssetConnectContextType | undefined>(undefined);

export const AssetConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoConnectedMetaMask, setAutoConnectedMetaMask] = useState<string | null>(null);
  const [autoConnectedBase, setAutoConnectedBase] = useState<string | null>(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState<boolean>(false);
  const [isConnectingBase, setIsConnectingBase] = useState<boolean>(false);
  
  // Pending wallets (connected but deposit not confirmed) - initialized from backend JSON
  const [pendingMetaMask, setPendingMetaMask] = useState<{ address: string; walletId: string } | null>(null);
  const [pendingBase, setPendingBase] = useState<{ address: string; walletId: string } | null>(null);
  
  // Initialize connected state from backend JSON on mount
  const [connectedMetaMask, setConnectedMetaMask] = useState<boolean>(false);
  const [connectedBase, setConnectedBase] = useState<boolean>(false);
  
  // Get VavityAggregator context for wallet operations
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator } = useVavity();

  // Helper function to save pending connection to backend
  const savePendingConnectionToBackend = async (address: string, walletId: string, walletType: 'metamask' | 'base') => {
    if (!email) return;
    try {
      await axios.post('/api/savePendingConnection', {
        email,
        pendingConnection: {
          address,
          walletId,
          walletType,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('[AssetConnect] Error saving pending connection to backend:', error);
    }
  };

  // Helper function to remove pending connection from backend
  const removePendingConnectionFromBackend = async (address: string, walletType: 'metamask' | 'base') => {
    if (!email) return;
    try {
      await axios.delete('/api/savePendingConnection', {
        data: { email, address, walletType },
      });
    } catch (error) {
      console.error('[AssetConnect] Error removing pending connection from backend:', error);
    }
  };

  // Helper function to fetch pending connections from backend
  const fetchPendingConnectionsFromBackend = async (): Promise<any[]> => {
    if (!email) return [];
    try {
      const response = await axios.get('/api/savePendingConnection', { params: { email } });
      return response.data.pendingConnections || [];
    } catch (error) {
      console.error('[AssetConnect] Error fetching pending connections from backend:', error);
      return [];
    }
  };
  
  // Initialize button state from backend JSON on mount
  useEffect(() => {
    const initializeButtonStateFromBackend = async () => {
      if (!email || typeof window === 'undefined') return;
      
      try {
        const pendingConnections = await fetchPendingConnectionsFromBackend();
        const activePending = pendingConnections.filter(
          (pc: any) => !pc.depositCancelled && !pc.depositCompleted
        );
        
        // Set pending wallet state from backend JSON
        const pendingMetaMaskConn = activePending.find((pc: any) => pc.walletType === 'metamask');
        const pendingBaseConn = activePending.find((pc: any) => pc.walletType === 'base');
        
        if (pendingMetaMaskConn) {
          setPendingMetaMask({ address: pendingMetaMaskConn.address, walletId: pendingMetaMaskConn.walletId });
        }
        if (pendingBaseConn) {
          setPendingBase({ address: pendingBaseConn.address, walletId: pendingBaseConn.walletId });
        }
        
        // Set connected state from backend JSON (if deposit was completed)
        const completedMetaMask = pendingConnections.find(
          (pc: any) => pc.walletType === 'metamask' && pc.depositCompleted && !pc.depositCancelled
        );
        const completedBase = pendingConnections.find(
          (pc: any) => pc.walletType === 'base' && pc.depositCompleted && !pc.depositCancelled
        );
        
        if (completedMetaMask && localStorage.getItem('lastConnectedMetaMask')) {
          setConnectedMetaMask(true);
        }
        if (completedBase && localStorage.getItem('lastConnectedBase')) {
          setConnectedBase(true);
        }
      } catch (error) {
        console.error('[AssetConnect] Error initializing button state from backend:', error);
      }
    };
    
    initializeButtonStateFromBackend();
  }, [email]);
  
  // Use refs to prevent multiple executions (persist across re-renders but reset on mount)
  const hasProcessedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastProcessedAddressRef = useRef<string | null>(null);
  
  // Process pending wallet after reload - only run once per pending wallet
  useEffect(() => {
    
    const processPendingWallet = async () => {
      if (!email || typeof window === 'undefined') {
        return;
      }
      
      // CRITICAL: Check backend FIRST for pending connections (independent of page reloads)
      // This JSON tracks deposits per wallet type (metamask vs base) and address
      let pendingConnection = null;
      let completedConnectionForThisWallet = null;
      try {
        const backendPendingConnections = await fetchPendingConnectionsFromBackend();
        
        // Get current pending wallet from React state (initialized from backend JSON)
        const currentPendingMetaMask = pendingMetaMask;
        const currentPendingBase = pendingBase;
        const pendingAddressFromStorage = currentPendingMetaMask?.address || currentPendingBase?.address;
        const pendingTypeFromStorage = currentPendingMetaMask ? 'metamask' : (currentPendingBase ? 'base' : null) as WalletType | null;
        
        // Find connection matching current address AND wallet type
        const matchingConnection = backendPendingConnections.find(
          (pc: any) => 
            pc.address?.toLowerCase() === pendingAddressFromStorage?.toLowerCase() &&
            pc.walletType === pendingTypeFromStorage
        );
        
        if (matchingConnection) {
          // If deposit was completed for this specific wallet type, use it
          if (matchingConnection.depositCompleted && !matchingConnection.depositCancelled) {
            completedConnectionForThisWallet = matchingConnection;
            console.log('[AssetConnect] Found completed deposit in JSON for', pendingTypeFromStorage, 'wallet:', matchingConnection.address);
          } else if (!matchingConnection.depositCancelled && !matchingConnection.depositCompleted) {
            // Still pending
            pendingConnection = matchingConnection;
          }
        }
        
        // Fallback: Get the most recent pending connection that hasn't been cancelled (if no match found)
        if (!pendingConnection && !completedConnectionForThisWallet) {
          const activeConnections = backendPendingConnections.filter(
            (pc: any) => !pc.depositCancelled && !pc.depositCompleted
          );
          if (activeConnections.length > 0) {
            activeConnections.sort((a: any, b: any) => b.timestamp - a.timestamp);
            pendingConnection = activeConnections[0];
          }
        }
      } catch (error) {
        console.error('[AssetConnect] Error fetching pending connections from backend:', error);
      }
      
      // If we have a completed connection for this wallet type, use that (deposit was done, just need to create wallet)
      if (completedConnectionForThisWallet && !pendingConnection) {
        pendingConnection = completedConnectionForThisWallet;
      }
      
      // Get pending info from backend JSON ONLY (no sessionStorage fallback)
      const pendingAddress = pendingConnection?.address;
      const pendingType = pendingConnection?.walletType as WalletType | undefined;
      const pendingWalletId = pendingConnection?.walletId;
      const depositCompleted = pendingConnection?.depositCompleted || false;
      const depositConfirmed = pendingConnection?.depositCompleted || false;
      
      if (!pendingAddress || !pendingType) {
        return;
      }
      
      // Check if deposit was cancelled FIRST - before any state updates (from backend JSON ONLY)
      const depositCancelled = pendingConnection?.depositCancelled || false;
      if (depositCancelled) {
        // Remove from backend FIRST (independent of page reloads)
        await removePendingConnectionFromBackend(pendingAddress, pendingType);
        
        // Clear ALL pending wallet state since it was cancelled
        if (pendingType === 'metamask') {
          setPendingMetaMask(null);
        } else {
          setPendingBase(null);
        }
        isProcessingRef.current = false;
        hasProcessedRef.current = false;
        return;
      }
      
      // Double-check to prevent race conditions
      if (isProcessingRef.current || hasProcessedRef.current) {
        return;
      }
      
      // Check if we've already processed this address (only if deposit was completed)
      const processedKey = `processed_${pendingAddress.toLowerCase()}`;
      // depositConfirmed is already set above from backend or sessionStorage
      
      // Check if wallet already exists in VavityAggregator with depositPaid = true
      // This handles the case where wallet was disconnected and reconnected
        const existingData = await fetchVavityAggregator(email);
        const existingWallets = existingData.wallets || [];
      const existingWalletWithDeposit = existingWallets.find(
        (wallet: any) => wallet.address?.toLowerCase() === pendingAddress.toLowerCase() && wallet.depositPaid === true
      );

      // If wallet already exists with depositPaid = true, skip deposit flow and just mark as connected
      if (existingWalletWithDeposit) {
        // Update balance without asking for deposit
        const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
        try {
          const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(pendingAddress)}&tokenAddress=${encodeURIComponent(tokenAddress)}`);
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const balance = parseFloat(balanceData.balance || '0');
            
            // Update wallet balance
            const currentVapa = Math.max(vapa || 0, assetPrice || 0);
            const newCVactTaa = balance;
            const newCpVact = Math.max(existingWalletWithDeposit.cpVact || 0, currentVapa);
            const newCVact = newCVactTaa * newCpVact;
            const newCdVatoc = newCVact - (existingWalletWithDeposit.cVatoc || 0);
            
            const updatedWallet = {
              ...existingWalletWithDeposit,
              cVactTaa: newCVactTaa,
              cpVact: newCpVact,
              cVact: parseFloat(newCVact.toFixed(2)),
              cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
            };
            
            const updatedWallets = existingWallets.map((w: any) => 
              w.walletId === existingWalletWithDeposit.walletId ? updatedWallet : w
            );
            
            const vavityCombinations = existingData.vavityCombinations || {};
            await saveVavityAggregator(email, updatedWallets, vavityCombinations);
          }
        } catch (error) {
          console.error('[AssetConnect] Error updating wallet balance:', error);
        }
        
        // Mark as connected without deposit flow
        if (pendingType === 'metamask') {
          setConnectedMetaMask(true);
          setPendingMetaMask(null);
        } else {
          setConnectedBase(true);
          setPendingBase(null);
        }
        
        hasProcessedRef.current = true;
        isProcessingRef.current = false;
          return;
        }

      // Only skip if deposit was confirmed AND we've processed it AND wallet is in VavityAggregator
      const addressInVavity = existingWallets.some(
        (wallet: any) => wallet.address?.toLowerCase() === pendingAddress.toLowerCase() && wallet.depositPaid === true
      );

      if (hasProcessedRef.current && depositConfirmed && addressInVavity) {
        isProcessingRef.current = false;
        hasProcessedRef.current = true;
          return;
        }
      
      // CRITICAL: Check if deposit was already completed (either from flags OR blockchain)
      // This handles the case where deposit completed on blockchain but page reloaded before wallet was saved
      const shouldCompleteWalletCreation = depositConfirmed || (!addressInVavity && pendingAddress);
      
      if (shouldCompleteWalletCreation && !addressInVavity) {
        console.log('[AssetConnect] Checking if deposit was already completed on blockchain...');
        
        // Get wallet provider to check blockchain
        let provider: any = null;
        if (pendingType === 'metamask') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
          } else if ((window as any).ethereum?.isMetaMask) {
            provider = (window as any).ethereum;
          }
        } else if (pendingType === 'base') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            provider = (window as any).ethereum;
          }
        }
        
        // CRITICAL: Check if deposit was already completed
        // First check backend for stored txHash (fastest)
        let depositTxHash: string | null = null;
        if (pendingConnection?.txHash) {
          depositTxHash = pendingConnection.txHash;
          console.log('[AssetConnect] Found deposit txHash in backend:', depositTxHash);
          // Verify transaction is confirmed on blockchain
          if (provider) {
            try {
              const isConfirmed = await verifyTransactionExists(provider, depositTxHash);
              if (!isConfirmed) {
                depositTxHash = null; // Transaction not confirmed yet
              }
            } catch (error) {
              console.error('[AssetConnect] Error verifying transaction:', error);
              depositTxHash = null;
            }
          }
        } else if (provider) {
          // If no txHash in backend, check blockchain (slower but more reliable)
          try {
            depositTxHash = await checkExistingDepositTransaction(provider, pendingAddress);
            if (depositTxHash) {
              console.log('[AssetConnect] Found existing deposit transaction on blockchain:', depositTxHash);
            }
          } catch (error) {
            console.error('[AssetConnect] Error checking blockchain for deposit:', error);
          }
        }
        
        // If deposit was confirmed (from flags) OR found on blockchain, complete wallet creation
        if (depositConfirmed || depositTxHash) {
          console.log('[AssetConnect] Deposit confirmed (flags or blockchain), completing wallet creation...');
          
          try {
            // Fetch current balance
            const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
            const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(pendingAddress)}&tokenAddress=${encodeURIComponent(tokenAddress)}`);
            
            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              const balance = parseFloat(balanceData.balance || '0');
              
              // Fetch VAPA
              const currentVapa = Math.max(assetPrice || 0, vapa || 0);
              
              // Create wallet with depositPaid=true (deposit was already completed)
              const walletId = pendingWalletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newCVactTaa = balance;
              const newCpVact = currentVapa;
              const newCVact = newCVactTaa * newCpVact;
              const newCVatoc = newCVact; // cVatoc should equal cVact at connection time
              const newCpVatoc = currentVapa; // cpVatoc should be VAPA at time of connection
              const newCdVatoc = newCVact - newCVatoc; // Should be 0 at connection time
              
              const walletData = {
                walletId: walletId,
                address: pendingAddress,
                vapaa: tokenAddress,
                depositPaid: true, // Deposit was already completed
                cVatoc: parseFloat(newCVatoc.toFixed(2)),
                cpVatoc: newCpVatoc,
                cVact: parseFloat(newCVact.toFixed(2)),
                cpVact: newCpVact,
                cVactTaa: newCVactTaa,
                cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
              };
              
              // Add wallet to VavityAggregator
              await addVavityAggregator(email, [walletData]);
              
              // Wallet created successfully
              if (pendingType === 'metamask') {
                setConnectedMetaMask(true);
                setPendingMetaMask(null);
              } else {
                setConnectedBase(true);
                setPendingBase(null);
              }

              // Update backend to mark deposit as completed
              if (depositTxHash) {
                try {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      address: pendingAddress,
                      walletId: walletId,
                      walletType: pendingType,
                      timestamp: Date.now(),
                      depositCompleted: true,
                      txHash: depositTxHash,
                    },
                  });
                } catch (error) {
                  console.error('[AssetConnect] Error updating pending connection in backend:', error);
                }
              }
              
              // Remove from backend
              setTimeout(async () => {
                await removePendingConnectionFromBackend(pendingAddress, pendingType);
              }, 1000);
              
              hasProcessedRef.current = true;
              isProcessingRef.current = false;
              return;
            }
          } catch (error) {
            console.error('[AssetConnect] Error completing wallet creation after deposit:', error);
            // Fall through to normal flow - will try to create wallet again
          }
        }
      }
      
      // Don't clear processedKey if depositConfirmed - we'll handle it in the depositConfirmed check above
      // Only clear if wallet is not in VavityAggregator AND deposit was NOT confirmed (retry scenario)
      if ((hasProcessedRef.current || depositConfirmed) && !addressInVavity && !depositConfirmed) {
      }
      
      isProcessingRef.current = true;
      
      // Add a delay to ensure wallet provider is ready after page reload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // Get pending wallet ID from backend JSON
        if (!pendingWalletId) {
          isProcessingRef.current = false;
          return;
        }

        // Set pending wallet state immediately so button shows "WAITING FOR DEPOSIT..."
        const pendingWalletData = { address: pendingAddress, walletId: pendingWalletId };
        if (pendingType === 'metamask') {
          setPendingMetaMask(pendingWalletData);
        } else {
          setPendingBase(pendingWalletData);
        }
        
        // Save to backend JSON immediately (this is the source of truth)
        await savePendingConnectionToBackend(pendingAddress, pendingWalletId, pendingType);

        // Step 1: Get wallet provider to fetch balance and send transaction
        let provider: any = null;
        if (pendingType === 'metamask') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
          } else if ((window as any).ethereum?.isMetaMask) {
            provider = (window as any).ethereum;
          }
        } else if (pendingType === 'base') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            provider = (window as any).ethereum;
          }
        }

        if (!provider) {
          console.error('[AssetConnect] Wallet provider not found! ethereum object:', !!((window as any).ethereum));
          throw new Error('Wallet provider not found. Please ensure your wallet extension is installed and unlocked.');
        }

        // CRITICAL: Check if deposit was already completed BEFORE asking for deposit again
        // Check 1: Is deposit marked as completed in JSON for THIS wallet type?
        // Check both pendingConnection and completedConnectionForThisWallet
        const connectionToCheck = pendingConnection || completedConnectionForThisWallet;
        const depositCompletedInJSONForThisWallet = connectionToCheck?.depositCompleted === true && 
          connectionToCheck?.walletType === pendingType &&
          connectionToCheck?.address?.toLowerCase() === pendingAddress.toLowerCase();
        
        // Check 2: Is wallet already in VavityAggregator with depositPaid=true?
        const existingDataCheck = await fetchVavityAggregator(email);
        const existingWalletsCheck = existingDataCheck.wallets || [];
        const walletAlreadyExists = existingWalletsCheck.some(
          (w: any) => w.address?.toLowerCase() === pendingAddress.toLowerCase() && w.depositPaid === true
        );
        
        // Check 3: Check backend JSON for stored txHash for THIS wallet type (fastest check)
        let depositTxHash: string | null = null;
        if (connectionToCheck?.txHash && depositCompletedInJSONForThisWallet) {
          depositTxHash = connectionToCheck.txHash;
          console.log('[AssetConnect] Found deposit txHash in JSON for', pendingType, 'wallet:', depositTxHash);
          // Verify transaction is confirmed on blockchain
          try {
            const isConfirmed = await verifyTransactionExists(provider, depositTxHash);
            if (!isConfirmed) {
              depositTxHash = null; // Transaction not confirmed yet
            }
          } catch (error) {
            console.error('[AssetConnect] Error verifying transaction:', error);
            depositTxHash = null;
          }
        } else if (provider && !depositCompletedInJSONForThisWallet) {
          // If not in JSON, check blockchain (slower but more reliable)
          try {
            depositTxHash = await checkExistingDepositTransaction(provider, pendingAddress);
            if (depositTxHash) {
              console.log('[AssetConnect] Found existing deposit transaction on blockchain:', depositTxHash);
              // If found on blockchain but not in JSON, update JSON
              try {
                await axios.post('/api/savePendingConnection', {
                  email,
                  pendingConnection: {
                    address: pendingAddress,
                    walletId: pendingWalletId || '',
                    walletType: pendingType,
                    timestamp: Date.now(),
                    depositCompleted: true,
                    txHash: depositTxHash,
                  },
                });
                console.log('[AssetConnect] Updated JSON with deposit confirmation for', pendingType);
              } catch (error) {
                console.error('[AssetConnect] Error updating JSON with deposit:', error);
              }
            }
          } catch (error) {
            console.error('[AssetConnect] Error checking blockchain for deposit:', error);
          }
        }
        
        // Check 4: Was deposit already confirmed (from JSON, flags, or blockchain)?
        const depositAlreadyConfirmed = depositCompletedInJSONForThisWallet || depositConfirmed || depositTxHash;
        
        // If wallet already exists OR deposit was confirmed, skip deposit flow
        if (walletAlreadyExists || depositAlreadyConfirmed) {
          console.log('[AssetConnect] Deposit already completed, skipping deposit flow');
          
          // If wallet doesn't exist yet but deposit was confirmed, create it now
          if (!walletAlreadyExists && depositAlreadyConfirmed) {
            try {
              // Fetch current balance
              const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
              const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(pendingAddress)}&tokenAddress=${encodeURIComponent(tokenAddress)}`);
              
              if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                const balance = parseFloat(balanceData.balance || '0');
                
                // Fetch VAPA
                const currentVapa = Math.max(assetPrice || 0, vapa || 0);
                
                // Create wallet with depositPaid=true
                const walletId = pendingWalletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newCVactTaa = balance;
                const newCpVact = currentVapa;
                const newCVact = newCVactTaa * newCpVact;
                const newCVatoc = newCVact;
                const newCpVatoc = currentVapa;
                const newCdVatoc = newCVact - newCVatoc;
                
                const walletData = {
                  walletId: walletId,
                  address: pendingAddress,
                  vapaa: tokenAddress,
                  depositPaid: true,
                  cVatoc: parseFloat(newCVatoc.toFixed(2)),
                  cpVatoc: newCpVatoc,
                  cVact: parseFloat(newCVact.toFixed(2)),
                  cpVact: newCpVact,
                  cVactTaa: newCVactTaa,
                  cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
                };
                
                await addVavityAggregator(email, [walletData]);
              }
            } catch (error) {
              console.error('[AssetConnect] Error creating wallet after confirmed deposit:', error);
            }
          }
          
          // Mark as connected
          if (pendingType === 'metamask') {
            setConnectedMetaMask(true);
            setPendingMetaMask(null);
          } else {
            setConnectedBase(true);
            setPendingBase(null);
          }
          
          // Remove from backend
          await removePendingConnectionFromBackend(pendingAddress, pendingType);
          
          hasProcessedRef.current = true;
          isProcessingRef.current = false;
          return;
        }
        
        // Step 2: Automatically trigger connectAsset flow (deposit + balance fetch)
        // This will prompt user for deposit, process transaction, and save wallet
        if (!depositCompleted) {
          
          try {
            const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
            
            // Use connectAssetUtil which handles deposit prompt, transaction, and balance fetching
            const { txHash, receipt, walletData } = await connectAssetUtil({
              provider,
              walletAddress: pendingAddress,
              tokenAddress: tokenAddress === '0x0000000000000000000000000000000000000000' ? undefined : tokenAddress,
              email,
              assetPrice,
              vapa,
              addVavityAggregator,
              fetchVavityAggregator,
              saveVavityAggregator,
            });
            
            // Mark deposit as confirmed for this wallet type
            if (pendingType === 'metamask') {
              setConnectedMetaMask(true);
              setPendingMetaMask(null);
            } else {
              setConnectedBase(true);
              setPendingBase(null);
            }
            
            // Update backend JSON to mark deposit as completed
            try {
              await axios.post('/api/savePendingConnection', {
                email,
                pendingConnection: {
                  address: pendingAddress,
                  walletId: pendingWalletId || '',
                  walletType: pendingType,
                  timestamp: Date.now(),
                  depositCompleted: true,
                  txHash: txHash || 'unknown',
                },
              });
            } catch (error) {
              console.error('[AssetConnect] Error updating pending connection in backend:', error);
            }
            
            // CRITICAL: Update backend to mark deposit as completed (independent of page reloads)
            try {
              await axios.post('/api/savePendingConnection', {
                email,
                pendingConnection: {
                  address: pendingAddress,
                  walletId: pendingWalletId || '',
                  walletType: pendingType,
                  timestamp: Date.now(),
                  depositCompleted: true,
                  txHash: txHash || 'unknown',
                },
              });
            } catch (error) {
              console.error('[AssetConnect] Error updating pending connection in backend:', error);
            }
            
            // Remove from backend after marking as completed
            setTimeout(async () => {
              await removePendingConnectionFromBackend(pendingAddress, pendingType);
            }, 1000);
            
            hasProcessedRef.current = true;
            isProcessingRef.current = false;
          } catch (connectError: any) {
            console.error('[processPendingWallet] Connect asset failed:', connectError);
            
            // If user cancelled, clear pending wallet so button goes back to "CONNECT ETHEREUM WITH METAMASK/BASE"
            // Check for various rejection error formats
            const errorMsg = String(connectError.message || connectError.toString() || 'Unknown error');
            const isCancelled = 
              errorMsg.toLowerCase().includes('cancelled') || 
              errorMsg.toLowerCase().includes('rejected') || 
              errorMsg.toLowerCase().includes('user rejected') ||
              errorMsg.toLowerCase().includes('user rejected the request') ||
              errorMsg.toLowerCase().includes('action rejected') ||
              connectError.code === 4001 ||
              connectError.code === 'ACTION_REJECTED';
            
            if (isCancelled) {
              // Mark cancellation in backend JSON to prevent auto-trigger on reload
              if (email) {
                try {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      address: pendingAddress,
                      walletId: pendingWalletId || '',
                      walletType: pendingType,
                      timestamp: Date.now(),
                      depositCancelled: true,
                    },
                  });
                } catch (error) {
                  console.error('[AssetConnect] Error marking cancellation in backend:', error);
                }
              }
              
              // Clear React state
              // Clear BOTH wallet types to be safe
              setPendingMetaMask(null);
              setPendingBase(null);
              
              // Reset processing flags
              isProcessingRef.current = false;
              hasProcessedRef.current = false;
              lastProcessedAddressRef.current = null; // Reset so it can be retried if user clicks again
              
              return;
            }
            
            // For other errors, check if it's a critical error that should show an alert
            // Don't show alert for non-critical errors (like VavityAggregator fetch failures after deposit)
            const isCriticalError = 
              !errorMsg.toLowerCase().includes('vavityaggregator') &&
              !errorMsg.toLowerCase().includes('fetchhighestethereumprice') &&
              !errorMsg.toLowerCase().includes('vapa fetch') &&
              !errorMsg.toLowerCase().includes('timeout');
            
            if (isCriticalError) {
              console.error('[processPendingWallet] Critical error details:', connectError);
              alert(`Failed to connect asset: ${errorMsg}\n\nPlease try connecting your wallet again.`);
            } else {
              console.warn('[processPendingWallet] Non-critical error (continuing):', connectError);
              // Don't show alert for non-critical errors, but log them
            }
            // Clear pending wallet state on error so button goes back to "CONNECT ETHEREUM WITH METAMASK/BASE"
            if (pendingType === 'metamask') {
              setPendingMetaMask(null);
            } else {
              setPendingBase(null);
            }
            // Clear processedKey so it doesn't auto-trigger again
            const processedKey = `processed_${pendingAddress.toLowerCase()}`;
            isProcessingRef.current = false;
            hasProcessedRef.current = false;
            lastProcessedAddressRef.current = null;
            return;
          }
        } else {
          // Deposit was already completed, just add wallet to VavityAggregator
          const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
          const balanceResponse = await fetch(`/api/tokenBalance?address=${pendingAddress}&tokenAddress=${tokenAddress}`);
          if (!balanceResponse.ok) {
            throw new Error('Failed to fetch wallet balance');
          }
          const balanceData = await balanceResponse.json();
          const balance = parseFloat(balanceData.balance || '0');

          // Fetch actual VAPA at time of connection to ensure cpVatoc is set correctly
          let actualVapa: number;
          try {
            const highestPriceResponse = await fetch('/api/fetchHighestEthereumPrice');
            const highestPriceData = await highestPriceResponse.json();
            const highestPriceEver = highestPriceData?.highestPriceEver || 0;
            // VAPA should be the maximum of: passed vapa, fetched highest price, or current assetPrice
            actualVapa = Math.max(vapa || 0, highestPriceEver || 0, assetPrice || 0);
          } catch (error) {
            console.error('[AssetConnect] Error fetching VAPA, using fallback:', error);
            // Fallback to using passed vapa or assetPrice
            actualVapa = Math.max(vapa || 0, assetPrice || 0);
          }
          
          const currentVapa = actualVapa;
          const currentAssetPrice = assetPrice || currentVapa;
          const newCVactTaa = balance;
          const newCpVact = currentVapa;
          const newCVact = newCVactTaa * newCpVact;
          const newCVatoc = newCVact;
          const newCpVatoc = currentVapa; // cpVatoc should always be VAPA at time of connection
          const newCdVatoc = newCVact - newCVatoc;
          
          const walletData = {
            walletId: pendingWalletId,
            address: pendingAddress,
            vapaa: tokenAddress,
            depositPaid: true,
            cVatoc: newCVatoc,
            cpVatoc: newCpVatoc,
            cVact: newCVact,
            cpVact: newCpVact,
            cVactTaa: newCVactTaa,
            cdVatoc: newCdVatoc,
          };

          await addVavityAggregator(email, [walletData]);
          
        if (pendingType === 'metamask') {
          setConnectedMetaMask(true);
          setPendingMetaMask(null);
        } else {
          setConnectedBase(true);
          setPendingBase(null);
        }
        }
      } catch (error) {
        console.error('Error processing pending wallet:', error);
        // Clear pending flags on error
      } finally {
        isProcessingRef.current = false;
      }
    };
    
    // Run immediately - the refs prevent duplicates
    // Only run if we haven't processed yet and there's a pending wallet
    // Get pending wallet from React state (initialized from backend JSON)
    const currentPendingMetaMask = pendingMetaMask;
    const currentPendingBase = pendingBase;
    const pendingAddress = currentPendingMetaMask?.address || currentPendingBase?.address;
    const pendingType = currentPendingMetaMask ? 'metamask' : (currentPendingBase ? 'base' : null) as WalletType | null;
    
    if (pendingAddress && pendingType) {
      // Check if this is a different pending wallet than we last processed
      const isNewPendingWallet = lastProcessedAddressRef.current !== pendingAddress.toLowerCase();
      if (isNewPendingWallet) {
        hasProcessedRef.current = false;
        isProcessingRef.current = false;
        lastProcessedAddressRef.current = pendingAddress.toLowerCase();
        // Clear deposit confirmed flags for new wallet connection
      }
      
      if (!hasProcessedRef.current && !isProcessingRef.current) {
        console.log('[AssetConnect] Found pending wallet, processing automatically...');
    processPendingWallet();
      } else {
      }
    } else {
      // Reset refs if no pending wallet
      hasProcessedRef.current = false;
      isProcessingRef.current = false;
      lastProcessedAddressRef.current = null;
    }
    
    // No cleanup needed - using refs for state management
  }, [email, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator]); // Include functions that are used in processPendingWallet
  
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
                  console.log('[AssetConnect] MetaMask extension connected but not in localStorage, setting it now');
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
                  console.log('[AssetConnect] Base extension connected but not in localStorage, setting it now');
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
        
        console.log('[AssetConnect] Checking connected wallets. Total wallets:', wallets.length);
        console.log('[AssetConnect] Last connected MetaMask:', lastConnectedMetaMask);
        console.log('[AssetConnect] Last connected Base:', lastConnectedBase);
        console.log('[AssetConnect] MetaMask extension account:', metaMaskAccount);
        console.log('[AssetConnect] MetaMask extension connected:', metaMaskExtensionConnected);
        console.log('[AssetConnect] Base extension account:', baseAccount);
        console.log('[AssetConnect] Base extension connected:', baseExtensionConnected);
        
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
        
        // Check if deposit was confirmed (only then mark as connected)
        // Check backend JSON for deposit confirmation
        const depositConfirmedMetaMask = connectedMetaMask;
        const depositConfirmedBase = connectedBase;
        
        // Show as connected if:
        // 1. Wallet is in VavityAggregator (deposit was confirmed and wallet saved)
        // 2. OR (address is in localStorage AND deposit was confirmed)
        // Note: We don't mark as connected just because extension is connected - need deposit confirmation
        const metaMaskConnected = metaMaskInWallets || (!!lastConnectedMetaMask && depositConfirmedMetaMask);
        const baseConnected = baseInWallets || (!!lastConnectedBase && depositConfirmedBase);
        
        // Check for pending wallets (connected but deposit not confirmed)
        // Pending wallets are already set in state from backend JSON initialization
        
        // If extension is disconnected AND wallet not in VavityAggregator, clear the state
        if (lastConnectedMetaMask && !metaMaskExtensionConnected && !metaMaskInWallets) {
          console.log('[AssetConnect] MetaMask disconnected - clearing state');
          localStorage.removeItem('lastConnectedMetaMask');
          setConnectedMetaMask(false);
          setPendingMetaMask(null);
        } else {
          // Set connected state only if deposit was confirmed
          setConnectedMetaMask(metaMaskConnected);
        }
        
        if (lastConnectedBase && !baseExtensionConnected && !baseInWallets) {
          console.log('[AssetConnect] Base disconnected - clearing state');
          localStorage.removeItem('lastConnectedBase');
          setConnectedBase(false);
          setPendingBase(null);
        } else {
          // Set connected state only if deposit was confirmed
          setConnectedBase(baseConnected);
        }
        
        console.log('[AssetConnect] Final state - MetaMask:', metaMaskConnected, 'Base:', baseConnected);
        console.log('[AssetConnect] State set - connectedMetaMask:', metaMaskConnected, 'connectedBase:', baseConnected);
      } catch (error) {
        console.error('[AssetConnect] Error checking connected wallets:', error);
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
              console.log('[AssetConnect] MetaMask disconnected - no accounts match');
              localStorage.removeItem('lastConnectedMetaMask');
              setConnectedMetaMask(false);
            }
          } catch (error) {
            console.log('[AssetConnect] Error checking MetaMask connection:', error);
            // If we can't check, assume disconnected
            localStorage.removeItem('lastConnectedMetaMask');
            setConnectedMetaMask(false);
          }
        } else {
          // MetaMask not available, clear state
          console.log('[AssetConnect] MetaMask provider not found');
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
              console.log('[AssetConnect] Base disconnected - no accounts match');
              localStorage.removeItem('lastConnectedBase');
              setConnectedBase(false);
            }
          } catch (error) {
            console.log('[AssetConnect] Error checking Base connection:', error);
            // If we can't check, assume disconnected
            localStorage.removeItem('lastConnectedBase');
            setConnectedBase(false);
          }
        } else {
          // Base not available, clear state
          console.log('[AssetConnect] Base provider not found');
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
      console.log('[AssetConnect] Accounts changed:', accounts);
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

  // Check for auto-connected wallets on mount - DISABLED
  // We don't want to auto-connect wallets - user must explicitly click the connect button
  // This prevents unwanted auto-connection prompts
  // useEffect(() => {
  //   const checkAutoConnectedWallets = async () => {
  //     // Only check on client side
  //     if (typeof window === 'undefined') return;

  //     try {
  //       // Check for MetaMask
  //       if ((window as any).ethereum) {
  //         let metamaskProvider: any = null;
          
  //         // Check if there are multiple providers
  //         if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
  //           metamaskProvider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
  //         } else if ((window as any).ethereum?.isMetaMask) {
  //           metamaskProvider = (window as any).ethereum;
  //         }

  //         if (metamaskProvider) {
  //           try {
  //             // Use eth_accounts (non-prompting) to check if already connected
  //             const accounts = await metamaskProvider.request({ method: 'eth_accounts' });
  //             if (accounts && accounts.length > 0) {
  //               console.log('MetaMask auto-connected:', accounts[0]);
  //               setAutoConnectedMetaMask(accounts[0]);
  //             }
  //           } catch (error) {
  //             console.log('Could not check MetaMask auto-connection:', error);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error checking auto-connected wallets:', error);
  //     }
  //   };

  //   checkAutoConnectedWallets();
  // }, []);

  const clearAutoConnectedMetaMask = useCallback(() => {
    setAutoConnectedMetaMask(null);
  }, []);

  const clearAutoConnectedBase = useCallback(() => {
    setAutoConnectedBase(null);
  }, []);

  // Connect Asset: Handles deposit and fetches balances
  const connectAssetForWallet = useCallback(async (walletType: WalletType): Promise<void> => {
    // Validate walletType
    if (typeof walletType !== 'string') {
      console.error('[connectAssetForWallet] Invalid walletType:', walletType, typeof walletType);
      const walletTypeStr = String(walletType);
      throw new Error(`Invalid wallet type: ${walletTypeStr}. Expected 'metamask' or 'base'.`);
    }
    
    if (walletType !== 'metamask' && walletType !== 'base') {
      console.error('[connectAssetForWallet] Unknown walletType:', walletType);
      throw new Error(`Unknown wallet type: ${walletType}. Expected 'metamask' or 'base'.`);
    }
    
    console.log(`[connectAssetForWallet] Called with walletType:`, walletType, 'type:', typeof walletType);
    
    // Get pending wallet from React state (initialized from backend JSON)
    let pendingWallet = walletType === 'metamask' ? pendingMetaMask : pendingBase;
    // Get pending wallet from React state (initialized from backend JSON) - no sessionStorage fallback
    if (!pendingWallet) {
      // Try fetching from backend JSON as fallback
      try {
        const backendPendingConnections = await fetchPendingConnectionsFromBackend();
        const activePending = backendPendingConnections.filter(
          (pc: any) => !pc.depositCancelled && !pc.depositCompleted
        );
        const matchingPending = activePending.find((pc: any) => pc.walletType === walletType);
        if (matchingPending) {
          pendingWallet = { address: matchingPending.address, walletId: matchingPending.walletId };
          // Update React state
          if (walletType === 'metamask') {
            setPendingMetaMask(pendingWallet);
          } else {
            setPendingBase(pendingWallet);
          }
        }
      } catch (error) {
        console.error('[connectAssetForWallet] Error fetching from backend:', error);
      }
    }
    
    if (!pendingWallet) {
      console.error('[connectAssetForWallet] No pending wallet found. pendingMetaMask:', pendingMetaMask, 'pendingBase:', pendingBase);
      throw new Error('No pending wallet found');
    }

    // Get wallet provider
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

    if (!provider) {
      throw new Error('Wallet provider not found');
    }

    try {
      // Use connectAssetUtil function which handles deposit and balance fetching
      // For native ETH, pass undefined (will be converted to zero address in connectAssetUtil)
      const { txHash, receipt, walletData } = await connectAssetUtil({
        provider,
        walletAddress: pendingWallet.address,
        tokenAddress: undefined, // Native ETH - undefined will be handled in connectAssetUtil
        email,
        assetPrice,
        vapa,
        addVavityAggregator,
        fetchVavityAggregator,
        saveVavityAggregator,
      });

      console.log(`[connectAssetForWallet] Asset connected successfully: ${txHash}`);

      // Mark deposit as confirmed
      if (walletType === 'metamask') {
        setConnectedMetaMask(true);
        setPendingMetaMask(null);
      } else {
        setConnectedBase(true);
        setPendingBase(null);
      }

      // CRITICAL: Update backend to mark deposit as completed with txHash (independent of page reloads)
      if (pendingWallet) {
        try {
          await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: {
              address: pendingWallet.address,
              walletId: pendingWallet.walletId || '',
              walletType: walletType,
              timestamp: Date.now(),
              depositCompleted: true,
              txHash: txHash || 'unknown',
            },
          });
        } catch (error) {
          console.error('[AssetConnect] Error updating pending connection in backend:', error);
        }
        
        // Remove from backend after marking as completed
        setTimeout(async () => {
          await removePendingConnectionFromBackend(pendingWallet.address, walletType);
        }, 1000);
      }
      
      // Clear pending wallet flags
      
      // Don't reload - wallet is already created and saved
    } catch (error: any) {
      console.error('[connectAssetForWallet] Error:', error);
      // If user cancelled, throw with a message that can be caught
      if (error?.message?.includes('rejected') || error?.message?.includes('cancelled') || error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
        throw new Error('User rejected');
      }
      throw error;
    }
  }, [pendingMetaMask, pendingBase, email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator]);

  // Connect Asset function that handles entire connection flow (wallet connection + deposit)
  const connectAsset = useCallback(async (walletType: WalletType): Promise<void> => {
    // Validate walletType
    if (typeof walletType !== 'string') {
      console.error('[connectAsset] Invalid walletType:', walletType, typeof walletType);
      const walletTypeStr = String(walletType);
      throw new Error(`Invalid wallet type: ${walletTypeStr}. Expected 'metamask' or 'base'.`);
    }
    
    if (walletType !== 'metamask' && walletType !== 'base') {
      console.error('[connectAsset] Unknown walletType:', walletType);
      throw new Error(`Unknown wallet type: ${walletType}. Expected 'metamask' or 'base'.`);
    }
    
    // Set connecting state
    if (walletType === 'metamask') {
      setIsConnectingMetaMask(true);
    } else {
      setIsConnectingBase(true);
    }

    // Declare shouldExit before try block so it's accessible after catch
    let shouldExit = false;
    try {
      if (!email) {
        throw new Error('Please sign in first to connect a wallet.');
      }
      
      // Step 1: Connect to wallet
      const { accounts } = await connectWalletUtil(walletType);
      
      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts found. Please approve the connection in ${walletType === 'metamask' ? 'MetaMask' : 'Base'}.`);
      }

      const walletAddress = accounts[0];
      
      // Create wallet ID immediately (but don't mark as connected yet)
      const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store wallet address and wallet ID in localStorage (for persistence)
      if (walletType === 'metamask') {
        localStorage.setItem('lastConnectedMetaMask', walletAddress);
      } else {
        localStorage.setItem('lastConnectedBase', walletAddress);
      }
      
      // Store pending wallet info (needs deposit confirmation) - save to backend JSON ONLY
      if (typeof window !== 'undefined') {
        const pendingWallet = { address: walletAddress, walletId };
        if (walletType === 'metamask') {
          setPendingMetaMask(pendingWallet);
        } else {
          setPendingBase(pendingWallet);
        }
        
        // CRITICAL: Save to backend immediately (independent of page reloads) - this is the source of truth
        await savePendingConnectionToBackend(walletAddress, walletId, walletType);
      }
      
      // Reset connecting state
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
      
      // Get wallet provider to trigger deposit flow immediately (no reload needed)
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
      
      if (!provider) {
        console.error('[connectAsset] Wallet provider not found after connection!');
        throw new Error('Wallet provider not found. Please ensure your wallet extension is installed and unlocked.');
      }
      
      // Trigger deposit flow immediately
      try {
        const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
        
        const { txHash, receipt, walletData } = await connectAssetUtil({
          provider,
          walletAddress: walletAddress,
          tokenAddress: tokenAddress === '0x0000000000000000000000000000000000000000' ? undefined : tokenAddress,
          email,
          assetPrice,
          vapa,
          addVavityAggregator,
          fetchVavityAggregator,
          saveVavityAggregator,
        });
        
        // Mark deposit as confirmed
        if (walletType === 'metamask') {
          setConnectedMetaMask(true);
          setPendingMetaMask(null);
        } else {
          setConnectedBase(true);
          setPendingBase(null);
        }
        
        // CRITICAL: Update backend to mark deposit as completed with txHash (independent of page reloads)
        try {
          await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: {
              address: walletAddress,
              walletId: walletId || '',
              walletType: walletType,
              timestamp: Date.now(),
              depositCompleted: true,
              txHash: txHash || 'unknown',
            },
          });
        } catch (error) {
          console.error('[AssetConnect] Error updating pending connection in backend:', error);
        }
        
        // Remove from backend after marking as completed
        setTimeout(async () => {
          await removePendingConnectionFromBackend(walletAddress, walletType);
        }, 1000);
        
        // Clear pending wallet flags
      } catch (depositError: any) {
        console.error('[connectAsset] Deposit flow failed:', depositError);
        
        
        // If user cancelled, clear pending wallet so button goes back to "CONNECT ETHEREUM WITH METAMASK/BASE"
        // Check for various rejection error formats
        const errorMsg = String(depositError.message || depositError.toString() || '');
        const isCancelled = 
          errorMsg.toLowerCase().includes('cancelled') || 
          errorMsg.toLowerCase().includes('rejected') || 
          errorMsg.toLowerCase().includes('user rejected') ||
          errorMsg.toLowerCase().includes('user rejected the request') ||
          errorMsg.toLowerCase().includes('action rejected') ||
          depositError.code === 4001 ||
          depositError.code === 'ACTION_REJECTED';
        
        if (isCancelled) {
          console.log('User cancelled deposit, clearing pending wallet state');
          
          // CRITICAL: Remove from backend (independent of page reloads)
          await removePendingConnectionFromBackend(walletAddress, walletType);
          
          // Clear pending wallet state so button shows "CONNECT ETHEREUM WITH METAMASK/BASE"
          if (walletType === 'metamask') {
            setPendingMetaMask(null);
          } else {
            setPendingBase(null);
          }
          // Reset connecting state
          if (walletType === 'metamask') {
            setIsConnectingMetaMask(false);
          } else {
            setIsConnectingBase(false);
          }
          // Set flag to exit function after catch block
          shouldExit = true;
        } else {
          // For other errors, throw to be handled by outer catch
          throw depositError;
        }
      }
    } catch (error: any) {
      console.error('Error in connectAsset:', error);
      
      // Check if this is a cancellation error
      const errorMsg = String(error?.message || error?.toString() || '');
      const isCancelled = 
        errorMsg.toLowerCase().includes('cancelled') || 
        errorMsg.toLowerCase().includes('rejected') || 
        errorMsg.toLowerCase().includes('user rejected') ||
        errorMsg.toLowerCase().includes('user rejected the request') ||
        errorMsg.toLowerCase().includes('action rejected') ||
        error?.code === 4001 ||
        error?.code === 'ACTION_REJECTED';
      
      // If user cancelled, clear pending wallet state silently (no alert)
      if (isCancelled) {
        console.log('User cancelled deposit in connectAsset, clearing pending wallet state');
        if (walletType === 'metamask') {
          setPendingMetaMask(null);
        } else {
          setPendingBase(null);
        }
      }
      
      // Reset connecting state on error
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
      
      // Only throw error if it's not a cancellation (so outer handlers can show alert for real errors)
      if (!isCancelled) {
        throw error;
      }
      // Even on error, if we got the wallet address, try to reload
      const walletAddressFromError = error?.walletAddress || (typeof window !== 'undefined' && localStorage.getItem(walletType === 'metamask' ? 'lastConnectedMetaMask' : 'lastConnectedBase'));
      if (walletAddressFromError) {
        console.log('Error occurred but wallet was connected, reloading anyway...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
      // Don't throw if cancelled - just exit silently
    }
    
    // If deposit was cancelled, exit function early (after try-catch to avoid syntax error)
    if (shouldExit) {
      return;
    }
  }, [email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator]);

  return (
    <AssetConnectContext.Provider
      value={{
        autoConnectedMetaMask,
        autoConnectedBase,
        isConnectingMetaMask,
        isConnectingBase,
        connectedMetaMask,
        connectedBase,
        pendingMetaMask,
        pendingBase,
        connectAsset,
        connectAssetForWallet,
        clearAutoConnectedMetaMask,
        clearAutoConnectedBase,
        setPendingMetaMask,
        setPendingBase,
        setIsConnectingMetaMask,
        setIsConnectingBase,
      }}
    >
      {children}
    </AssetConnectContext.Provider>
  );
};

export const useAssetConnect = () => {
  const context = useContext(AssetConnectContext);
  if (context === undefined) {
    throw new Error('useAssetConnect must be used within an AssetConnectProvider');
  }
  return context;
};
