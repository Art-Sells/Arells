'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { connectWallet as connectWalletUtil, WalletType } from '../utils/walletConnection';
import { useVavity } from './VavityAggregator';
import { completeDepositFlow, calculateDepositAmount } from '../utils/depositTransaction';
import { connectAsset as connectAssetUtil } from '../utils/connectAsset';

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
}

const AssetConnectContext = createContext<AssetConnectContextType | undefined>(undefined);

export const AssetConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoConnectedMetaMask, setAutoConnectedMetaMask] = useState<string | null>(null);
  const [autoConnectedBase, setAutoConnectedBase] = useState<string | null>(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState<boolean>(false);
  const [isConnectingBase, setIsConnectingBase] = useState<boolean>(false);
  
  // Pending wallets (connected but deposit not confirmed)
  const [pendingMetaMask, setPendingMetaMask] = useState<{ address: string; walletId: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const pending = sessionStorage.getItem('pendingMetaMask');
      return pending ? JSON.parse(pending) : null;
    }
    return null;
  });
  const [pendingBase, setPendingBase] = useState<{ address: string; walletId: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const pending = sessionStorage.getItem('pendingBase');
      return pending ? JSON.parse(pending) : null;
    }
    return null;
  });
  
  // Initialize connected state from localStorage on mount (only if deposit was confirmed)
  const [connectedMetaMask, setConnectedMetaMask] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      // Only mark as connected if deposit was confirmed (check sessionStorage)
      const depositConfirmed = sessionStorage.getItem('depositConfirmedMetaMask') === 'true';
      return depositConfirmed && !!localStorage.getItem('lastConnectedMetaMask');
    }
    return false;
  });
  const [connectedBase, setConnectedBase] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const depositConfirmed = sessionStorage.getItem('depositConfirmedBase') === 'true';
      return depositConfirmed && !!localStorage.getItem('lastConnectedBase');
    }
    return false;
  });
  
  // Get VavityAggregator context for wallet operations
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator } = useVavity();
  
  // Process pending wallet after reload - only run once per pending wallet
  useEffect(() => {
    let isProcessing = false;
    let hasProcessed = false;
    
    const processPendingWallet = async () => {
      console.log('[AssetConnect] processPendingWallet called. email:', email, 'window:', typeof window !== 'undefined');
      
      if (!email || typeof window === 'undefined') {
        console.log('[AssetConnect] Skipping - no email or not in browser');
        return;
      }
      
      if (isProcessing || hasProcessed) {
        console.log('[AssetConnect] Skipping - already processing or processed');
        return; // Prevent multiple executions
      }
      
      const pendingAddress = sessionStorage.getItem('pendingWalletAddress');
      const pendingType = sessionStorage.getItem('pendingWalletType');
      const depositCompleted = sessionStorage.getItem('depositCompleted') === 'true';
      
      console.log('[AssetConnect] Pending wallet check:', { pendingAddress, pendingType, depositCompleted });
      
      if (!pendingAddress || !pendingType) {
        console.log('[AssetConnect] No pending wallet found in sessionStorage');
        return;
      }
      
      // Check if we've already processed this address (only if deposit was completed)
      const processedKey = `processed_${pendingAddress.toLowerCase()}`;
      const depositConfirmedKey = pendingType === 'metamask' 
        ? 'depositConfirmedMetaMask' 
        : 'depositConfirmedBase';
      const depositConfirmed = sessionStorage.getItem(depositConfirmedKey) === 'true';
      
      console.log('[AssetConnect] Checking processedKey:', { 
        processedKey, 
        hasProcessedKey: !!sessionStorage.getItem(processedKey),
        depositConfirmedKey,
        depositConfirmed 
      });
      
      // Only skip if deposit was confirmed AND we've processed it
      if (sessionStorage.getItem(processedKey) && depositConfirmed) {
        console.log('[AssetConnect] Pending wallet already processed with confirmed deposit, clearing flags');
        sessionStorage.removeItem('pendingWalletAddress');
        sessionStorage.removeItem('pendingWalletType');
        sessionStorage.removeItem('depositCompleted');
        return;
      }
      
      // Clear processedKey if it exists but deposit wasn't confirmed (retry scenario)
      if (sessionStorage.getItem(processedKey) && !depositConfirmed) {
        console.log('[AssetConnect] Found processedKey but deposit not confirmed, clearing it for retry');
        sessionStorage.removeItem(processedKey);
      }
      
      isProcessing = true;
      console.log('[AssetConnect] Processing pending wallet after reload:', pendingAddress, 'Type:', pendingType);
      
      // Check if we've already processed this address (only if deposit was completed)
      const processedKey = `processed_${pendingAddress.toLowerCase()}`;
      const depositConfirmedKey = pendingType === 'metamask' 
        ? 'depositConfirmedMetaMask' 
        : 'depositConfirmedBase';
      const depositConfirmed = sessionStorage.getItem(depositConfirmedKey) === 'true';
      
      console.log('[AssetConnect] Checking processedKey:', { 
        processedKey, 
        hasProcessedKey: !!sessionStorage.getItem(processedKey),
        depositConfirmedKey,
        depositConfirmed 
      });
      
      // Only skip if deposit was confirmed AND we've processed it
      if (sessionStorage.getItem(processedKey) && depositConfirmed) {
        console.log('[AssetConnect] Pending wallet already processed with confirmed deposit, clearing flags');
        sessionStorage.removeItem('pendingWalletAddress');
        sessionStorage.removeItem('pendingWalletType');
        sessionStorage.removeItem('depositCompleted');
        return;
      }
      
      // Clear processedKey if it exists but deposit wasn't confirmed (retry scenario)
      if (sessionStorage.getItem(processedKey) && !depositConfirmed) {
        console.log('[AssetConnect] Found processedKey but deposit not confirmed, clearing it for retry');
        sessionStorage.removeItem(processedKey);
        // Also clear processing flag to allow retry
        sessionStorage.removeItem(processingKey);
      }
      
      console.log('[AssetConnect] Processing pending wallet after reload:', pendingAddress, 'Type:', pendingType);
      
      // Add a delay to ensure wallet provider is ready after page reload
      // Wait a bit longer to ensure wallet extension is fully loaded
      console.log('[AssetConnect] Waiting for wallet provider to be ready...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // Check if wallet is already connected
        const existingData = await fetchVavityAggregator(email);
        const existingWallets = existingData.wallets || [];
        const addressAlreadyConnected = existingWallets.some(
          (wallet: any) => wallet.address?.toLowerCase() === pendingAddress.toLowerCase()
        );

        if (addressAlreadyConnected) {
          console.log('[AssetConnect] Pending wallet already in VavityAggregator, skipping');
          sessionStorage.setItem(processedKey, 'true');
          sessionStorage.removeItem('pendingWalletAddress');
          sessionStorage.removeItem('pendingWalletType');
          sessionStorage.removeItem('depositCompleted');
          sessionStorage.removeItem(processingKey); // Clear processing flag
          return;
        }

        // Get pending wallet ID from sessionStorage
        const pendingWalletId = sessionStorage.getItem('pendingWalletId');
        if (!pendingWalletId) {
          console.log('[AssetConnect] No pending wallet ID found, skipping');
          return;
        }

        // Step 1: Get wallet provider to fetch balance and send transaction
        console.log('[AssetConnect] Looking for wallet provider. Type:', pendingType);
        let provider: any = null;
        if (pendingType === 'metamask') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isMetaMask);
            console.log('[AssetConnect] Found MetaMask in providers array');
          } else if ((window as any).ethereum?.isMetaMask) {
            provider = (window as any).ethereum;
            console.log('[AssetConnect] Found MetaMask as main ethereum object');
          }
        } else if (pendingType === 'base') {
          if ((window as any).ethereum?.providers && Array.isArray((window as any).ethereum.providers)) {
            provider = (window as any).ethereum.providers.find((p: any) => p.isCoinbaseWallet || p.isBase);
            console.log('[AssetConnect] Found Base in providers array');
          } else if ((window as any).ethereum?.isCoinbaseWallet || (window as any).ethereum?.isBase) {
            provider = (window as any).ethereum;
            console.log('[AssetConnect] Found Base as main ethereum object');
          }
        }

        if (!provider) {
          console.error('[AssetConnect] Wallet provider not found! ethereum object:', !!((window as any).ethereum));
          throw new Error('Wallet provider not found. Please ensure your wallet extension is installed and unlocked.');
        }
        
        console.log('[AssetConnect] Wallet provider found, proceeding with deposit flow...');

        // Step 2: Automatically trigger connectAsset flow (deposit + balance fetch)
        // This will prompt user for deposit, process transaction, and save wallet
        if (!depositCompleted) {
          try {
            const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
            console.log('[processPendingWallet] Automatically triggering connectAsset flow...');
            
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

            console.log(`[processPendingWallet] Asset connected successfully: ${txHash}`);
            
            // Mark deposit as confirmed for this wallet type
            if (pendingType === 'metamask') {
              sessionStorage.setItem('depositConfirmedMetaMask', 'true');
              setConnectedMetaMask(true);
              setPendingMetaMask(null);
              sessionStorage.removeItem('pendingMetaMask');
            } else {
              sessionStorage.setItem('depositConfirmedBase', 'true');
              setConnectedBase(true);
              setPendingBase(null);
              sessionStorage.removeItem('pendingBase');
            }
            
            sessionStorage.setItem(processedKey, 'true');
            sessionStorage.removeItem('pendingWalletAddress');
            sessionStorage.removeItem('pendingWalletType');
            sessionStorage.removeItem('pendingWalletId');
            sessionStorage.removeItem('depositCompleted');
            // Clear processing flag and timestamp
            if (processingKey) {
              sessionStorage.removeItem(processingKey);
              sessionStorage.removeItem(`${processingKey}_time`);
            }
          } catch (connectError: any) {
            console.error('[processPendingWallet] Connect asset failed:', connectError);
            
            // If user cancelled, keep pending wallet so button shows "CONNECT (MM)(ETH) Asset"
            if (connectError.message?.includes('cancelled') || connectError.message?.includes('Deposit cancelled') || connectError.message?.includes('User rejected')) {
              console.log('User cancelled deposit, keeping pending wallet for retry');
              sessionStorage.removeItem('pendingWalletAddress');
              sessionStorage.removeItem('pendingWalletType');
              sessionStorage.removeItem('pendingWalletId');
              sessionStorage.removeItem('depositCompleted');
              // Keep pendingMetaMask/pendingBase in sessionStorage so button shows new text
              isProcessing = false;
              return;
            }
            
            // For other errors, show alert and keep pending wallet for retry
            const errorMsg = connectError.message || connectError.toString() || 'Unknown error';
            console.error('[processPendingWallet] Error details:', connectError);
            alert(`Failed to connect asset: ${errorMsg}\n\nPlease try connecting your wallet again.`);
            sessionStorage.removeItem('pendingWalletAddress');
            sessionStorage.removeItem('pendingWalletType');
            sessionStorage.removeItem('pendingWalletId');
            sessionStorage.removeItem('depositCompleted');
            sessionStorage.removeItem(processingKey); // Clear processing flag
            sessionStorage.removeItem(`${processingKey}_time`); // Clear timestamp
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

          const currentVapa = Math.max(vapa || 0, assetPrice || 0);
          const currentAssetPrice = assetPrice || currentVapa;
          const newCVactTaa = balance;
          const newCpVact = currentVapa;
          const newCVact = newCVactTaa * newCpVact;
          const newCVatoi = newCVact;
          const newCpVatoi = currentAssetPrice;
          const newCdVatoi = newCVact - newCVatoi;
          
          const walletData = {
            walletId: pendingWalletId,
            address: pendingAddress,
            vapaa: tokenAddress,
            depositPaid: true,
            cVatoi: newCVatoi,
            cpVatoi: newCpVatoi,
            cVact: newCVact,
            cpVact: newCpVact,
            cVactTaa: newCVactTaa,
            cdVatoi: newCdVatoi,
          };

          await addVavityAggregator(email, [walletData]);
          console.log('Pending wallet added to VavityAggregator with VAPAA:', tokenAddress);
          
          if (pendingType === 'metamask') {
            setConnectedMetaMask(true);
            setPendingMetaMask(null);
            sessionStorage.removeItem('pendingMetaMask');
          } else {
            setConnectedBase(true);
            setPendingBase(null);
            sessionStorage.removeItem('pendingBase');
          }
          
          sessionStorage.setItem(processedKey, 'true');
          sessionStorage.removeItem('pendingWalletAddress');
          sessionStorage.removeItem('pendingWalletType');
          sessionStorage.removeItem('pendingWalletId');
          sessionStorage.removeItem('depositCompleted');
          sessionStorage.removeItem(processingKey); // Clear processing flag
        }
      } catch (error) {
        console.error('Error processing pending wallet:', error);
        // Clear pending flags on error
        sessionStorage.removeItem('pendingWalletAddress');
        sessionStorage.removeItem('pendingWalletType');
        sessionStorage.removeItem('depositCompleted');
        // Clear processing flag on error
        const pendingAddr = sessionStorage.getItem('pendingWalletAddress');
        const pendingTyp = sessionStorage.getItem('pendingWalletType');
        if (pendingAddr && pendingTyp) {
          const procKey = `processing_${pendingAddr.toLowerCase()}_${pendingTyp}`;
          sessionStorage.removeItem(procKey);
          sessionStorage.removeItem(`${procKey}_time`);
        }
      }
    };
    
    // Run processPendingWallet - check if there's a pending wallet first
    const hasPendingWallet = sessionStorage.getItem('pendingWalletAddress') && sessionStorage.getItem('pendingWalletType');
    
    if (hasPendingWallet) {
      // Check if we've already tried to process this specific wallet
      const pendingAddr = sessionStorage.getItem('pendingWalletAddress');
      const pendingTyp = sessionStorage.getItem('pendingWalletType');
      const processingKey = pendingAddr && pendingTyp ? `processing_${pendingAddr.toLowerCase()}_${pendingTyp}` : null;
      
      // Check timeout for processing flag
      if (processingKey) {
        const isProcessing = sessionStorage.getItem(processingKey) === 'true';
        const processingTime = sessionStorage.getItem(`${processingKey}_time`);
        const now = Date.now();
        const PROCESSING_TIMEOUT = 30000; // 30 seconds
        
        if (isProcessing && processingTime) {
          const timeElapsed = now - parseInt(processingTime);
          if (timeElapsed > PROCESSING_TIMEOUT) {
            console.log('[AssetConnect] Processing timeout expired, clearing flag and retrying');
            sessionStorage.removeItem(processingKey);
            sessionStorage.removeItem(`${processingKey}_time`);
          } else {
            console.log('[AssetConnect] Already processing this wallet, skipping');
            return;
          }
        }
      }
      
      console.log('[AssetConnect] Found pending wallet, processing...');
      processPendingWallet();
    } else {
      console.log('[AssetConnect] No pending wallet found, skipping processPendingWallet');
    }
    
    // No cleanup needed - using sessionStorage for state management
  }, [email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator]); // Dependencies
  
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
        const depositConfirmedMetaMask = sessionStorage.getItem('depositConfirmedMetaMask') === 'true';
        const depositConfirmedBase = sessionStorage.getItem('depositConfirmedBase') === 'true';
        
        // Show as connected if:
        // 1. Wallet is in VavityAggregator (deposit was confirmed and wallet saved)
        // 2. OR (address is in localStorage AND deposit was confirmed)
        // Note: We don't mark as connected just because extension is connected - need deposit confirmation
        const metaMaskConnected = metaMaskInWallets || (!!lastConnectedMetaMask && depositConfirmedMetaMask);
        const baseConnected = baseInWallets || (!!lastConnectedBase && depositConfirmedBase);
        
        // Check for pending wallets (connected but deposit not confirmed)
        const pendingMM = sessionStorage.getItem('pendingMetaMask');
        const pendingCB = sessionStorage.getItem('pendingBase');
        
        if (pendingMM && !depositConfirmedMetaMask) {
          try {
            const pending = JSON.parse(pendingMM);
            setPendingMetaMask(pending);
          } catch (e) {
            console.error('Error parsing pendingMetaMask:', e);
          }
        }
        
        if (pendingCB && !depositConfirmedBase) {
          try {
            const pending = JSON.parse(pendingCB);
            setPendingBase(pending);
          } catch (e) {
            console.error('Error parsing pendingBase:', e);
          }
        }
        
        // If extension is disconnected AND wallet not in VavityAggregator, clear the state
        if (lastConnectedMetaMask && !metaMaskExtensionConnected && !metaMaskInWallets) {
          console.log('[AssetConnect] MetaMask disconnected - clearing state');
          localStorage.removeItem('lastConnectedMetaMask');
          sessionStorage.removeItem('pendingMetaMask');
          sessionStorage.removeItem('depositConfirmedMetaMask');
          setConnectedMetaMask(false);
          setPendingMetaMask(null);
        } else {
          // Set connected state only if deposit was confirmed
          setConnectedMetaMask(metaMaskConnected);
        }
        
        if (lastConnectedBase && !baseExtensionConnected && !baseInWallets) {
          console.log('[AssetConnect] Base disconnected - clearing state');
          localStorage.removeItem('lastConnectedBase');
          sessionStorage.removeItem('pendingBase');
          sessionStorage.removeItem('depositConfirmedBase');
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
    
    const pendingWallet = walletType === 'metamask' ? pendingMetaMask : pendingBase;
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
        sessionStorage.setItem('depositConfirmedMetaMask', 'true');
        setConnectedMetaMask(true);
        setPendingMetaMask(null);
        sessionStorage.removeItem('pendingMetaMask');
      } else {
        sessionStorage.setItem('depositConfirmedBase', 'true');
        setConnectedBase(true);
        setPendingBase(null);
        sessionStorage.removeItem('pendingBase');
      }

      // Reload to refresh UI
      window.location.reload();
    } catch (error: any) {
      console.error('[connectAssetForWallet] Error:', error);
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

    try {
      if (!email) {
        throw new Error('Please sign in first to connect a wallet.');
      }

      console.log(`[connectAsset] Requesting ${walletType} wallet connection...`);
      console.log(`[connectAsset] walletType type:`, typeof walletType, 'value:', walletType);
      
      // Step 1: Connect to wallet
      const { accounts } = await connectWalletUtil(walletType);
      
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error(`No accounts found. Please approve the connection in ${walletType === 'metamask' ? 'MetaMask' : 'Base'}.`);
      }

      const walletAddress = accounts[0];
      console.log('Wallet address from request:', walletAddress);
      
      // Create wallet ID immediately (but don't mark as connected yet)
      const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store wallet address and wallet ID in localStorage (for persistence)
      if (walletType === 'metamask') {
        localStorage.setItem('lastConnectedMetaMask', walletAddress);
      } else {
        localStorage.setItem('lastConnectedBase', walletAddress);
      }
      
      // Store pending wallet info in sessionStorage (needs deposit confirmation)
      if (typeof window !== 'undefined') {
        const pendingWallet = { address: walletAddress, walletId };
        if (walletType === 'metamask') {
          sessionStorage.setItem('pendingMetaMask', JSON.stringify(pendingWallet));
          setPendingMetaMask(pendingWallet);
        } else {
          sessionStorage.setItem('pendingBase', JSON.stringify(pendingWallet));
          setPendingBase(pendingWallet);
        }
        
        // Store for post-reload processing
        sessionStorage.setItem('pendingWalletAddress', walletAddress);
        sessionStorage.setItem('pendingWalletType', walletType);
        sessionStorage.setItem('pendingWalletId', walletId);
      }
      
      // Reset connecting state
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
      
      // RELOAD IMMEDIATELY - deposit flow will happen after reload
      console.log('RELOADING PAGE IMMEDIATELY after wallet connection! Wallet ID created:', walletId);
      if (typeof window !== 'undefined') {
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
          // NOTE: This code path should not execute due to immediate reload, but included for safety
          const currentVapa = Math.max(vapa || 0, assetPrice || 0);
          const currentAssetPrice = assetPrice || currentVapa;
          const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH (default)
          const newCVactTaa = 0; // Balance will be fetched by VavityAggregator
          const newCpVact = currentVapa;
          const newCVact = newCVactTaa * newCpVact;
          const newCVatoi = newCVact;
          const newCpVatoi = currentAssetPrice;
          const newCdVatoi = newCVact - newCVatoi;
          
          const walletData = {
            walletId: walletId,
            address: walletAddress,
            vapaa: tokenAddress, // VAPAA: token address
            depositPaid: false, // Default to false (deposit not paid yet)
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
      console.error('Error in connectAsset:', error);
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

