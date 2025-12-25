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
  
  // Setters for connecting state ONLY (UI state, not wallet state)
  // Pending and connected states come from backend JSON only - setters are stubs that do nothing
  setIsConnectingMetaMask: (isConnecting: boolean) => void;
  setIsConnectingBase: (isConnecting: boolean) => void;
  setPendingMetaMask: (wallet: { address: string; walletId: string } | null) => void;
  setPendingBase: (wallet: { address: string; walletId: string } | null) => void;
}

const AssetConnectContext = createContext<AssetConnectContextType | undefined>(undefined);

export const AssetConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoConnectedMetaMask, setAutoConnectedMetaMask] = useState<string | null>(null);
  const [autoConnectedBase, setAutoConnectedBase] = useState<string | null>(null);
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState<boolean>(false);
  const [isConnectingBase, setIsConnectingBase] = useState<boolean>(false);
  
  // CRITICAL: All wallet states come from backend JSON ONLY - no local state
  // Store backend connections and compute pending/connected from them
  const [backendConnections, setBackendConnections] = useState<any[]>([]);
  
  // Computed values from backend JSON (derived, not stored in state)
  const pendingMetaMask = React.useMemo(() => {
    const activePending = backendConnections.filter((pc: any) => 
      !pc.depositCancelled && !pc.depositCompleted && pc.walletType === 'metamask'
    );
    const conn = activePending[0];
    return conn ? { address: conn.address, walletId: conn.walletId } : null;
  }, [backendConnections]);
  
  const pendingBase = React.useMemo(() => {
    const activePending = backendConnections.filter((pc: any) => 
      !pc.depositCancelled && !pc.depositCompleted && pc.walletType === 'base'
    );
    const conn = activePending[0];
    return conn ? { address: conn.address, walletId: conn.walletId } : null;
  }, [backendConnections]);
  
  const connectedMetaMask = React.useMemo(() => {
    return backendConnections.some((pc: any) => 
      pc.walletType === 'metamask' && pc.depositCompleted && !pc.depositCancelled
    );
  }, [backendConnections]);
  
  const connectedBase = React.useMemo(() => {
    return backendConnections.some((pc: any) => 
      pc.walletType === 'base' && pc.depositCompleted && !pc.depositCancelled
    );
  }, [backendConnections]);
  
  // Stub setters that do nothing - state comes from backend JSON only
  // These are kept for backward compatibility but don't actually set state
  // To update state, update the backend JSON instead (via savePendingConnectionToBackend, etc.)
  const setPendingMetaMask = useCallback((wallet: { address: string; walletId: string } | null) => {
    // State comes from backend JSON - this setter does nothing
    // State will update automatically when backend JSON changes (polled every 1 second)
  }, []);
  
  const setPendingBase = useCallback((wallet: { address: string; walletId: string } | null) => {
    // State comes from backend JSON - this setter does nothing
    // State will update automatically when backend JSON changes (polled every 1 second)
  }, []);
  
  // Get VavityAggregator context for wallet operations
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator } = useVavity();

  // Helper function to save pending connection to backend
  // NOTE: This only UPDATES the JSON file - it does NOT create it
  // The JSON file should be created when buttons are clicked (in VavityTester.tsx)
  const savePendingConnectionToBackend = async (address: string, walletId: string, walletType: 'metamask' | 'base') => {
    if (!email) {
      console.log('[AssetConnect savePendingConnectionToBackend] No email, skipping');
      return;
    }
    console.log('[AssetConnect savePendingConnectionToBackend] Updating connection in JSON:', { address, walletId, walletType, email });
    
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
            accounts.some((acc: string) => acc.toLowerCase() === address.toLowerCase());
        } catch (e) {
          walletExtensionConnected = false;
        }
      }
    }
    
    // First, check if JSON file exists - if not, log warning (should have been created by button click)
    try {
      const checkResponse = await axios.get('/api/savePendingConnection', { params: { email } });
      const existingConnections = checkResponse.data.pendingConnections || [];
      if (existingConnections.length === 0) {
        console.warn('[AssetConnect savePendingConnectionToBackend] WARNING: JSON file appears empty - it should have been created when button was clicked');
      }
    } catch (checkError) {
      console.warn('[AssetConnect savePendingConnectionToBackend] WARNING: Could not verify JSON file exists - it should have been created when button was clicked');
      // Continue anyway - API will create it if needed, but this shouldn't happen
    }
    
    try {
      const response = await axios.post('/api/savePendingConnection', {
        email,
        pendingConnection: {
          address,
          walletId,
          walletType,
          timestamp: Date.now(),
          walletExtensionConnected: walletExtensionConnected, // Track if wallet extension is connected
        },
      });
      console.log('[AssetConnect savePendingConnectionToBackend] Successfully saved:', response.status, response.data);
      
      // Verify it was saved by fetching again
      try {
        const verifyResponse = await axios.get('/api/savePendingConnection', { params: { email } });
        const verifyConnections = verifyResponse.data.pendingConnections || [];
        const verifyConn = verifyConnections.find(
          (pc: any) => pc.address?.toLowerCase() === address.toLowerCase() && pc.walletType === walletType
        );
        console.log('[AssetConnect savePendingConnectionToBackend] Verification - connection after save:', verifyConn ? {
          address: verifyConn.address,
          walletType: verifyConn.walletType,
          depositCancelled: verifyConn.depositCancelled,
          depositCompleted: verifyConn.depositCompleted
        } : 'NOT FOUND');
      } catch (verifyErr) {
        console.error('[AssetConnect savePendingConnectionToBackend] Error verifying save:', verifyErr);
      }
    } catch (error) {
      console.error('[AssetConnect] Error saving pending connection to backend:', error);
    }
  };

  // Helper function to mark pending connection as cancelled in backend
  // CRITICAL: This marks ALL pending connections for the wallet type, regardless of address
  // This ensures cancellation works even after page reload when address might not match
  const markPendingConnectionAsCancelled = async (address: string | null, walletType: 'metamask' | 'base') => {
    console.log('[AssetConnect markPendingConnectionAsCancelled] FUNCTION CALLED with:', { address, walletType, email, hasEmail: !!email });
    if (!email) {
      console.error('[AssetConnect markPendingConnectionAsCancelled] ERROR: No email, cannot mark as cancelled!');
      return;
    }
    try {
      // Fetch existing connections
      const response = await axios.get('/api/savePendingConnection', { params: { email } });
      const pendingConnections = response.data.pendingConnections || [];
      console.log('[AssetConnect markPendingConnectionAsCancelled] Found connections:', pendingConnections.length);
      console.log('[AssetConnect markPendingConnectionAsCancelled] ALL connections in backend:', pendingConnections.map((pc: any) => ({
        address: pc.address,
        walletType: pc.walletType,
        depositCancelled: pc.depositCancelled,
        depositCompleted: pc.depositCompleted,
        timestamp: pc.timestamp
      })));
  
      // CRITICAL: Find ALL pending connections for this wallet type that aren't already cancelled/completed
      // Don't filter by address - mark ALL of them as cancelled to ensure we catch it
      // This handles cases where address might not match due to timing or reload issues
      const connectionsToCancel = pendingConnections.filter((pc: any) => 
        pc.walletType === walletType && 
        !pc.depositCancelled && 
        !pc.depositCompleted
        // REMOVED address filter - always mark ALL pending connections for this wallet type
      );
      
      console.log('[AssetConnect markPendingConnectionAsCancelled] Connections to cancel:', connectionsToCancel.length);
      console.log('[AssetConnect markPendingConnectionAsCancelled] Connections to cancel details:', connectionsToCancel.map((pc: any) => ({ 
        address: pc.address, 
        walletType: pc.walletType,
        depositCancelled: pc.depositCancelled,
        depositCompleted: pc.depositCompleted
      })));
      
      if (connectionsToCancel.length === 0) {
        console.warn('[AssetConnect markPendingConnectionAsCancelled] WARNING: No connections found to cancel for walletType:', walletType);
        console.warn('[AssetConnect markPendingConnectionAsCancelled] All connections for this wallet type:', pendingConnections.filter((pc: any) => pc.walletType === walletType));
      }
      
      // Mark all found connections as cancelled
      for (const connectionToCancel of connectionsToCancel) {
        if (!connectionToCancel.depositCancelled) {
          console.log('[AssetConnect markPendingConnectionAsCancelled] Marking as cancelled:', connectionToCancel.address);
          // Update it with depositCancelled: true
          // The POST endpoint will remove the old one and add this updated one
          // Preserve walletExtensionConnected field
          const updatedConnection = {
            ...connectionToCancel,
            depositCancelled: true,
            // Preserve walletExtensionConnected if it exists, otherwise set to false (disconnected)
            walletExtensionConnected: connectionToCancel.walletExtensionConnected ?? false,
          };
          console.log('[AssetConnect markPendingConnectionAsCancelled] POSTing updated connection:', JSON.stringify(updatedConnection, null, 2));
          console.log('[AssetConnect markPendingConnectionAsCancelled] CRITICAL: depositCancelled value being sent:', updatedConnection.depositCancelled);
          
          const response = await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: updatedConnection,
          });
          
          console.log('[AssetConnect] POST response:', response.status, response.data);
          console.log('[AssetConnect] Marked connection as cancelled in backend:', connectionToCancel.address, walletType);
          
          // CRITICAL: Wait a moment for S3 to propagate before verifying
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify it was saved by fetching again - check ALL connections to see what's actually in backend
          try {
            const verifyResponse = await axios.get('/api/savePendingConnection', { params: { email } });
            const verifyConnections = verifyResponse.data.pendingConnections || [];
            console.log('[AssetConnect] Verification - ALL connections in backend:', verifyConnections.map((pc: any) => ({
              address: pc.address,
              walletType: pc.walletType,
              depositCancelled: pc.depositCancelled,
              depositCompleted: pc.depositCompleted
            })));
            
            const verifyConn = verifyConnections.find(
              (pc: any) => pc.address?.toLowerCase() === connectionToCancel.address.toLowerCase() && pc.walletType === walletType
            );
            if (verifyConn) {
              console.log('[AssetConnect] Verification - connection after save:', {
                address: verifyConn.address,
                walletType: verifyConn.walletType,
                depositCancelled: verifyConn.depositCancelled,
                depositCompleted: verifyConn.depositCompleted,
                ALL_FIELDS: verifyConn
              });
              
              if (!verifyConn.depositCancelled) {
                console.error('[AssetConnect] ERROR: depositCancelled is NOT true after save! Connection:', verifyConn);
              }
            } else {
              console.error('[AssetConnect] ERROR: Connection NOT FOUND after save! Expected:', {
                address: connectionToCancel.address,
                walletType: walletType
              });
            }
          } catch (verifyErr) {
            console.error('[AssetConnect] Error verifying cancellation:', verifyErr);
          }
        } else {
          console.log('[AssetConnect markPendingConnectionAsCancelled] Connection already cancelled:', connectionToCancel.address);
        }
      }
      
      if (connectionsToCancel.length === 0) {
        console.log('[AssetConnect] No connections found to mark as cancelled for:', walletType);
      }
    } catch (error) {
      console.error('[AssetConnect] Error marking pending connection as cancelled:', error);
      // Don't throw - we still want to set cancellation refs even if backend update fails
    }
  };

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
  
  // CRITICAL: All states come from backend JSON ONLY - continuously read from backend
  // This is the single source of truth - no local state for pending/connected
  useEffect(() => {
    const syncStateFromBackend = async () => {
      if (!email || typeof window === 'undefined') return;
      
      try {
        const pendingConnections = await fetchPendingConnectionsFromBackend();
        // Update backend connections - this will trigger useMemo to recompute pending/connected
        setBackendConnections(pendingConnections);
        
        // Update localStorage to match backend state (for wallet extension checks)
        const completedMetaMask = pendingConnections.find(
          (pc: any) => pc.walletType === 'metamask' && pc.depositCompleted && !pc.depositCancelled
        );
        const completedBase = pendingConnections.find(
          (pc: any) => pc.walletType === 'base' && pc.depositCompleted && !pc.depositCancelled
        );
        
        if (completedMetaMask && typeof window !== 'undefined') {
          localStorage.setItem('lastConnectedMetaMask', completedMetaMask.address);
        }
        if (completedBase && typeof window !== 'undefined') {
          localStorage.setItem('lastConnectedBase', completedBase.address);
    }
      } catch (error) {
        console.error('[AssetConnect] Error syncing state from backend:', error);
      }
    };
  
    // Run immediately on mount
    syncStateFromBackend();
    
    // Run periodically to catch updates (every 1 second for responsiveness)
    const intervalId = setInterval(syncStateFromBackend, 1000);
    
    return () => clearInterval(intervalId);
  }, [email]);
  
  // Use refs to prevent multiple executions (persist across re-renders but reset on mount)
  const hasProcessedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastProcessedAddressRef = useRef<string | null>(null);
  const lastCancelledAddressRef = useRef<string | null>(null);
  const lastCancelledTypeRef = useRef<WalletType | null>(null);
  const lastCancelledTimestampRef = useRef<number>(0);
  
  // Process pending wallet after reload - only run once per pending wallet
  useEffect(() => {
    
    const processPendingWallet = async () => {
      if (!email || typeof window === 'undefined') {
        return;
      }
      
      // CRITICAL: If we just cancelled something, don't process anything for 10 seconds
      // This prevents re-processing after cancellation
      if (lastCancelledAddressRef.current && lastCancelledTypeRef.current && lastCancelledTimestampRef.current > 0) {
        const timeSinceCancellation = Date.now() - lastCancelledTimestampRef.current;
        // Don't process for 10 seconds after cancellation
        if (timeSinceCancellation < 10000) {
          console.log('[AssetConnect] Recent cancellation detected, skipping processPendingWallet. Time since cancellation:', timeSinceCancellation, 'ms');
          // Clear any existing pending state
          setPendingMetaMask(null);
          setPendingBase(null);
          isProcessingRef.current = false;
          hasProcessedRef.current = false;
          return;
        } else {
          // Clear cancellation refs after timeout
          console.log('[AssetConnect] Cancellation timeout expired, clearing cancellation refs');
          lastCancelledAddressRef.current = null;
          lastCancelledTypeRef.current = null;
          lastCancelledTimestampRef.current = 0;
        }
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
      
        // CRITICAL: Check if there are ANY cancelled connections first - if so, don't process anything
        const hasCancelledConnections = backendPendingConnections.some(
          (pc: any) => pc.depositCancelled === true
        );
        
        if (hasCancelledConnections) {
          console.log('[AssetConnect] Found cancelled connections in backend, skipping processPendingWallet');
          // Clear local state if cancelled connections exist
          if (pendingAddressFromStorage) {
            if (pendingTypeFromStorage === 'metamask') {
              setPendingMetaMask(null);
            } else if (pendingTypeFromStorage === 'base') {
              setPendingBase(null);
            }
          }
          // Reset refs
          isProcessingRef.current = false;
          hasProcessedRef.current = false;
        return;
      }
      
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
        // ONLY if we have a pending address from state - don't pick up random connections
        if (!pendingConnection && !completedConnectionForThisWallet && pendingAddressFromStorage) {
          const activeConnections = backendPendingConnections.filter(
            (pc: any) => 
              !pc.depositCancelled && 
              !pc.depositCompleted &&
              pc.address?.toLowerCase() === pendingAddressFromStorage.toLowerCase() &&
              pc.walletType === pendingTypeFromStorage
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
        // If no pending connection found, make sure state is cleared
        if (pendingMetaMask || pendingBase) {
          console.log('[AssetConnect] No pending connection in backend but state exists, clearing it');
          setPendingMetaMask(null);
          setPendingBase(null);
        }
        return;
      }
      
      // CRITICAL: Don't process if this address was just cancelled (check BEFORE anything else)
      if (lastCancelledAddressRef.current === pendingAddress.toLowerCase() && 
          lastCancelledTypeRef.current === pendingType) {
        const timeSinceCancellation = Date.now() - lastCancelledTimestampRef.current;
        // Block for 10 seconds after cancellation
        if (timeSinceCancellation < 10000) {
          console.log('[AssetConnect] This address was just cancelled, skipping processPendingWallet and clearing state. Time since cancellation:', timeSinceCancellation, 'ms');
          // Clear state to be safe
          if (pendingType === 'metamask') {
            setPendingMetaMask(null);
          } else {
            setPendingBase(null);
          }
          // Double-check backend and mark as cancelled if not already
          const backendConnections = await fetchPendingConnectionsFromBackend();
          const thisConnection = backendConnections.find((pc: any) => 
            pc.address?.toLowerCase() === pendingAddress.toLowerCase() && 
            pc.walletType === pendingType
          );
          if (thisConnection && !thisConnection.depositCancelled) {
            await markPendingConnectionAsCancelled(pendingAddress, pendingType);
          }
          return;
        } else {
          // Clear cancellation refs after timeout
          lastCancelledAddressRef.current = null;
          lastCancelledTypeRef.current = null;
          lastCancelledTimestampRef.current = 0;
        }
      }
      
      // Check if deposit was cancelled FIRST - before any state updates (from backend JSON ONLY)
      const depositCancelled = pendingConnection?.depositCancelled || false;
      if (depositCancelled) {
        console.log('[AssetConnect] Deposit was cancelled, clearing pending wallet state and removing from backend immediately');
        
        // Clear ALL pending wallet state since it was cancelled (button will update)
        if (pendingType === 'metamask') {
          setPendingMetaMask(null);
        } else {
          setPendingBase(null);
        }
        
        // CRITICAL: Remove from backend IMMEDIATELY to prevent re-processing
        // Don't wait - we've already marked it as cancelled, so remove it now
        await removePendingConnectionFromBackend(pendingAddress, pendingType);
        
        // Mark this address as cancelled to prevent re-processing
        lastCancelledAddressRef.current = pendingAddress.toLowerCase();
        lastCancelledTypeRef.current = pendingType;
        lastCancelledTimestampRef.current = Date.now();
        
        // Reset all refs to prevent any re-processing
        isProcessingRef.current = false;
        hasProcessedRef.current = false;
        lastProcessedAddressRef.current = null;
        
        return;
      }
      
      // Check if wallet already exists in VavityAggregator with depositPaid = true
      // This handles the case where wallet was disconnected and reconnected
        const existingData = await fetchVavityAggregator(email);
        const existingWallets = existingData.wallets || [];
      const existingWalletWithDeposit = existingWallets.find(
        (wallet: any) => wallet.address?.toLowerCase() === pendingAddress.toLowerCase() && wallet.depositPaid === true
      );

      // Check if wallet exists in VavityAggregator
      const addressInVavity = existingWallets.some(
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
          // Connected/pending state comes from backend JSON - no need to set locally
        } else {
          // Connected/pending state comes from backend JSON - no need to set locally
        }
        
        hasProcessedRef.current = true;
        isProcessingRef.current = false;
          return;
        }

      // CRITICAL: If deposit was confirmed but wallet doesn't exist, we MUST create it
      // This handles the case where deposit completed on blockchain but page reloaded before wallet was saved
      // Skip the hasProcessedRef check if deposit is confirmed but wallet doesn't exist
      if (hasProcessedRef.current && depositConfirmed && addressInVavity) {
        // Already processed and wallet exists - skip
        isProcessingRef.current = false;
        hasProcessedRef.current = true;
        return;
      }
      
      // If deposit is confirmed but wallet doesn't exist, we need to create it
      // Don't skip even if hasProcessedRef is true - the wallet needs to be created
      if (depositConfirmed && !addressInVavity) {
        console.log('[AssetConnect] Deposit confirmed but wallet not in VavityAggregator, creating wallet...');
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
                // Connected state comes from backend JSON - no need to set locally
                setPendingMetaMask(null);
              } else {
                // Connected state comes from backend JSON - no need to set locally
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
                  console.log('[AssetConnect] Marked deposit as completed in backend - keeping connection in JSON');
                } catch (error) {
                  console.error('[AssetConnect] Error updating pending connection in backend:', error);
                }
              }
              
              // CRITICAL: DO NOT remove completed connections - keep them in JSON with depositCompleted: true
              // This allows state to persist across reloads and button to show "CONNECTED" state
              
              hasProcessedRef.current = true;
              isProcessingRef.current = false;
              return;
            }
          } catch (error) {
            console.error('[AssetConnect] Error completing wallet creation after deposit:', error);
            // Reset processing flag on error
            isProcessingRef.current = false;
            // Fall through to normal flow - will try to create wallet again
          }
        } else {
          // Deposit not confirmed yet - reset processing flag and continue to normal flow
          console.log('[AssetConnect] Deposit not confirmed yet, will continue to normal deposit flow');
          isProcessingRef.current = false;
        }
      }
      
      // Double-check to prevent race conditions (only if deposit is NOT confirmed)
      // If deposit is confirmed, we already handled it above
      if (!depositConfirmed && (isProcessingRef.current || hasProcessedRef.current)) {
        return;
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

        // CRITICAL: Check if this address was just cancelled before setting state
        if (lastCancelledAddressRef.current === pendingAddress.toLowerCase() && 
            lastCancelledTypeRef.current === pendingType) {
          console.log('[AssetConnect] Attempted to set pending state for cancelled address, blocking it');
          isProcessingRef.current = false;
          // Clear state to be safe
          if (pendingType === 'metamask') {
            setPendingMetaMask(null);
          } else {
            setPendingBase(null);
          }
          // Remove from backend if it still exists
          await removePendingConnectionFromBackend(pendingAddress, pendingType);
          return;
        }
        
        // CRITICAL: Double-check backend for cancellation flag before setting state
        const backendConnections = await fetchPendingConnectionsFromBackend();
        const thisConnection = backendConnections.find((pc: any) => 
          pc.address?.toLowerCase() === pendingAddress.toLowerCase() && 
          pc.walletType === pendingType
        );
        if (thisConnection?.depositCancelled) {
          console.log('[AssetConnect] Connection is marked as cancelled in backend, blocking state update');
          isProcessingRef.current = false;
          // Clear state
          if (pendingType === 'metamask') {
            setPendingMetaMask(null);
          } else {
            setPendingBase(null);
          }
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
        let depositCompletedInJSONForThisWallet = connectionToCheck?.depositCompleted === true && 
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
        let txHashExistsButNotConfirmed = false;
        
        if (connectionToCheck?.txHash) {
          depositTxHash = connectionToCheck.txHash;
          console.log('[AssetConnect] Found deposit txHash in JSON for', pendingType, 'wallet:', depositTxHash);
          // Verify transaction is confirmed on blockchain
          try {
            const isConfirmed = await verifyTransactionExists(provider, depositTxHash);
            if (isConfirmed) {
              // Transaction is confirmed - mark as completed
              console.log('[AssetConnect] Transaction confirmed, marking as completed');
              // Update JSON to mark as completed
              try {
                await axios.post('/api/savePendingConnection', {
                  email,
                  pendingConnection: {
                    address: pendingAddress,
                    walletId: pendingWalletId || '',
                    walletType: pendingType,
                    timestamp: connectionToCheck.timestamp || Date.now(),
                    depositCompleted: true,
                    txHash: depositTxHash,
                  },
                });
              } catch (error) {
                console.error('[AssetConnect] Error updating JSON with deposit confirmation:', error);
              }
            } else {
              // Transaction exists but not confirmed yet - poll for confirmation
              console.log('[AssetConnect] Transaction exists but not confirmed yet, polling for confirmation...');
              txHashExistsButNotConfirmed = true;
              depositTxHash = null; // Will be set after confirmation
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
        
        // If transaction exists but not confirmed, poll for confirmation
        if (txHashExistsButNotConfirmed && connectionToCheck?.txHash && provider) {
          console.log('[AssetConnect] Polling for transaction confirmation:', connectionToCheck.txHash);
          // Poll for confirmation (max 30 seconds, check every 2 seconds)
          const maxAttempts = 15;
          let confirmed = false;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
              const isConfirmed = await verifyTransactionExists(provider, connectionToCheck.txHash);
              if (isConfirmed) {
                confirmed = true;
                depositTxHash = connectionToCheck.txHash;
                // Update JSON to mark as completed
                try {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      address: pendingAddress,
                      walletId: pendingWalletId || '',
                      walletType: pendingType,
                      timestamp: connectionToCheck.timestamp || Date.now(),
                      depositCompleted: true,
                      txHash: connectionToCheck.txHash,
                    },
                  });
                } catch (error) {
                  console.error('[AssetConnect] Error updating JSON after confirmation:', error);
                }
                break;
              }
            } catch (error) {
              console.error('[AssetConnect] Error checking transaction confirmation:', error);
            }
            // Wait 2 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          if (!confirmed) {
            console.warn('[AssetConnect] Transaction not confirmed after polling, will retry on next check');
            // Don't ask for new deposit - transaction is pending
            isProcessingRef.current = false;
            return;
          } else {
            // Transaction confirmed after polling - update depositTxHash
            console.log('[AssetConnect] Transaction confirmed after polling, proceeding with wallet creation');
            depositTxHash = connectionToCheck.txHash;
            depositCompletedInJSONForThisWallet = true; // Mark as completed
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
            // Connected state comes from backend JSON - no need to set locally
            setPendingMetaMask(null);
          } else {
            // Connected state comes from backend JSON - no need to set locally
            setPendingBase(null);
          }
          
          // CRITICAL: DO NOT remove completed connections - keep them in JSON with depositCompleted: true
          // This allows state to persist across reloads and button to show "CONNECTED" state
          
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
            console.log('[processPendingWallet] About to call connectAssetUtil for deposit');
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
              walletId: pendingWalletId || '',
              walletType: pendingType,
            });
            console.log('[processPendingWallet] connectAssetUtil completed successfully');
            
            // Mark deposit as confirmed for this wallet type
            if (pendingType === 'metamask') {
              // Connected state comes from backend JSON - no need to set locally
              setPendingMetaMask(null);
            } else {
              // Connected state comes from backend JSON - no need to set locally
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
            
            // CRITICAL: DO NOT remove completed connections - keep them in JSON with depositCompleted: true
            // This allows state to persist across reloads and button to show "CONNECTED" state
            console.log('[AssetConnect] Marked deposit as completed in backend - keeping connection in JSON');
            
            hasProcessedRef.current = true;
            isProcessingRef.current = false;
          } catch (connectError: any) {
            console.error('[processPendingWallet] Connect asset failed:', connectError);
            console.log('[processPendingWallet] Error details:', {
              message: connectError?.message,
              code: connectError?.code,
              error: connectError?.error,
              isCancelled: connectError?.isCancelled,
              toString: connectError?.toString()
            });
            
            // If user cancelled, clear pending wallet so button goes back to "CONNECT ETHEREUM WITH METAMASK/BASE"
            // Check for various rejection error formats
            const errorMsg = String(connectError?.message || connectError?.toString() || 'Unknown error');
            const isCancelled = 
              connectError?.isCancelled === true ||
              errorMsg.toLowerCase().includes('cancelled') || 
              errorMsg.toLowerCase().includes('rejected') || 
              errorMsg.toLowerCase().includes('user rejected') ||
              errorMsg.toLowerCase().includes('user rejected the request') ||
              errorMsg.toLowerCase().includes('user rejected the deposit') ||
              errorMsg.toLowerCase().includes('action rejected') ||
              connectError?.code === 4001 ||
              connectError?.code === 'ACTION_REJECTED' ||
              connectError?.error?.code === 4001;
            
            console.log('[processPendingWallet] Cancellation check:', { isCancelled, errorMsg, code: connectError?.code });
            
            if (isCancelled) {
              console.log('[processPendingWallet] User cancelled deposit - clearing state immediately');
              
              // CRITICAL: Clear React state FIRST (immediate button update) - ALWAYS, regardless of backend
              // Clear BOTH wallet types to be safe
              setPendingMetaMask(null);
              setPendingBase(null);
              
              // Set cancellation refs IMMEDIATELY to prevent any re-processing
              // This works even if backend update fails
              lastCancelledAddressRef.current = pendingAddress.toLowerCase();
              lastCancelledTypeRef.current = pendingType;
              lastCancelledTimestampRef.current = Date.now();
              
              // Mark ALL pending connections for this wallet type as cancelled (address can be null to mark all)
              // This ensures we catch the cancellation even if address doesn't match
              markPendingConnectionAsCancelled(pendingAddress || null, pendingType).catch(err => {
                console.error('[processPendingWallet] Error marking cancelled connection (non-blocking):', err);
              });
              
              // Remove from backend after delay (non-blocking)
              // Keep it longer (30 seconds) so checkPending can detect cancellation after reload
              setTimeout(async () => {
                try {
                  await removePendingConnectionFromBackend(pendingAddress, pendingType);
                } catch (err) {
                  console.error('[processPendingWallet] Error removing cancelled connection:', err);
                }
              }, 30000); // Increased to 30 seconds to allow checkPending to detect cancellation after reload
              
              // Reset all processing flags
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
          // Connected/pending state comes from backend JSON - no need to set locally
          } else {
          // Connected/pending state comes from backend JSON - no need to set locally
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
        // processPendingWallet will check for cancellation internally
    processPendingWallet();
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
        // Connected state comes from backend JSON - no need to set locally
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
        
        // CRITICAL: Check backend JSON for deposit confirmation (source of truth)
        // This ensures connected state is always in sync with backend
        let depositConfirmedMetaMask = false;
        let depositConfirmedBase = false;
        try {
          const backendConnections = await fetchPendingConnectionsFromBackend();
          const completedMetaMask = backendConnections.find(
            (pc: any) => pc.walletType === 'metamask' && pc.depositCompleted && !pc.depositCancelled
          );
          const completedBase = backendConnections.find(
            (pc: any) => pc.walletType === 'base' && pc.depositCompleted && !pc.depositCancelled
          );
          depositConfirmedMetaMask = !!completedMetaMask;
          depositConfirmedBase = !!completedBase;
          
          // Update connected state from backend JSON
          if (completedMetaMask) {
            console.log('[AssetConnect checkConnectedWallets] Found completed MetaMask in backend, setting connected state');
            // Connected state comes from backend JSON - no need to set locally
          }
          if (completedBase) {
            console.log('[AssetConnect checkConnectedWallets] Found completed Base in backend, setting connected state');
            // Connected state comes from backend JSON - no need to set locally
          }
        } catch (error) {
          console.error('[AssetConnect] Error checking backend for completed connections:', error);
        }
        
        // Show as connected if:
        // 1. Wallet is in VavityAggregator (deposit was confirmed and wallet saved)
        // 2. OR (address is in localStorage AND deposit was confirmed in backend JSON)
        // Note: We don't mark as connected just because extension is connected - need deposit confirmation
        const metaMaskConnected = metaMaskInWallets || (!!lastConnectedMetaMask && depositConfirmedMetaMask);
        const baseConnected = baseInWallets || (!!lastConnectedBase && depositConfirmedBase);
        
        // Check for pending wallets (connected but deposit not confirmed)
        // Pending wallets are already set in state from backend JSON initialization
        
        // CRITICAL: Check backend JSON for pending connections and update walletExtensionConnected status
        // Also mark as cancelled if wallet is disconnected
        if (email) {
          try {
            const backendPendingConnections = await fetchPendingConnectionsFromBackend();
            
            // Update walletExtensionConnected status for all connections
            for (const connection of backendPendingConnections) {
              let shouldUpdate = false;
              let newExtensionConnected = false;
              
              if (connection.walletType === 'metamask') {
                // Check if MetaMask extension is connected and address matches
                newExtensionConnected = metaMaskExtensionConnected && 
                  (connection.address?.toLowerCase() === metaMaskAccount?.toLowerCase() || 
                   (lastConnectedMetaMask && connection.address?.toLowerCase() === lastConnectedMetaMask.toLowerCase()));
                // Update if status changed
                if (connection.walletExtensionConnected !== newExtensionConnected) {
                  shouldUpdate = true;
                }
              } else if (connection.walletType === 'base') {
                // Check if Base extension is connected and address matches
                newExtensionConnected = baseExtensionConnected && 
                  (connection.address?.toLowerCase() === baseAccount?.toLowerCase() || 
                   (lastConnectedBase && connection.address?.toLowerCase() === lastConnectedBase.toLowerCase()));
                // Update if status changed
                if (connection.walletExtensionConnected !== newExtensionConnected) {
                  shouldUpdate = true;
                }
              }
              
              // Update the connection with new walletExtensionConnected status
              if (shouldUpdate) {
                console.log(`[AssetConnect] Updating walletExtensionConnected for ${connection.walletType}:`, {
                  address: connection.address,
                  oldStatus: connection.walletExtensionConnected,
                  newStatus: newExtensionConnected,
                  metaMaskExtensionConnected,
                  baseExtensionConnected,
                  metaMaskAccount,
                  baseAccount
                });
                try {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      ...connection,
                      walletExtensionConnected: newExtensionConnected,
                    },
                  });
                } catch (updateError) {
                  console.error('[AssetConnect] Error updating walletExtensionConnected:', updateError);
                }
              }
            }
            
            // Check for MetaMask pending connections
            const pendingMetaMaskConn = backendPendingConnections.find(
              (pc: any) => pc.walletType === 'metamask' && !pc.depositCancelled && !pc.depositCompleted
            );
            
            // If there's a pending MetaMask connection but extension is not connected, mark as cancelled
            if (pendingMetaMaskConn && !metaMaskExtensionConnected && !metaMaskInWallets) {
              console.log('[AssetConnect] MetaMask disconnected - marking pending connection as cancelled in backend');
              if (lastConnectedMetaMask) {
                localStorage.removeItem('lastConnectedMetaMask');
              }
              await markPendingConnectionAsCancelled(null, 'metamask');
            }
            
            // Check for Base pending connections
            const pendingBaseConn = backendPendingConnections.find(
              (pc: any) => pc.walletType === 'base' && !pc.depositCancelled && !pc.depositCompleted
            );
            
            // If there's a pending Base connection but extension is not connected, mark as cancelled
            if (pendingBaseConn && !baseExtensionConnected && !baseInWallets) {
              console.log('[AssetConnect] Base disconnected - marking pending connection as cancelled in backend');
              if (lastConnectedBase) {
                localStorage.removeItem('lastConnectedBase');
              }
              await markPendingConnectionAsCancelled(null, 'base');
            }
          } catch (error) {
            console.error('[AssetConnect] Error checking backend for pending connections on disconnect:', error);
          }
        }
        
        // Also handle localStorage-based disconnection detection (for backward compatibility)
        if (lastConnectedMetaMask && !metaMaskExtensionConnected && !metaMaskInWallets) {
          console.log('[AssetConnect] MetaMask disconnected (localStorage-based detection)');
          localStorage.removeItem('lastConnectedMetaMask');
          // Backend cancellation already handled above
        }
        
        if (lastConnectedBase && !baseExtensionConnected && !baseInWallets) {
          console.log('[AssetConnect] Base disconnected (localStorage-based detection)');
          localStorage.removeItem('lastConnectedBase');
          // Backend cancellation already handled above
        }
        
        console.log('[AssetConnect] Final state - MetaMask:', metaMaskConnected, 'Base:', baseConnected);
        console.log('[AssetConnect] State set - connectedMetaMask:', metaMaskConnected, 'connectedBase:', baseConnected);
      } catch (error) {
        console.error('[AssetConnect] Error checking connected wallets:', error);
        // Connected state comes from backend JSON - no need to set locally
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
              // Connected state comes from backend JSON - no need to set locally
            }
          } catch (error) {
            console.log('[AssetConnect] Error checking MetaMask connection:', error);
            // If we can't check, assume disconnected
            localStorage.removeItem('lastConnectedMetaMask');
            // Connected state comes from backend JSON - no need to set locally
          }
        } else {
          // MetaMask not available, clear state
          console.log('[AssetConnect] MetaMask provider not found');
          localStorage.removeItem('lastConnectedMetaMask');
          // Connected state comes from backend JSON - no need to set locally
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
              // Connected state comes from backend JSON - no need to set locally
            }
          } catch (error) {
            console.log('[AssetConnect] Error checking Base connection:', error);
            // If we can't check, assume disconnected
            localStorage.removeItem('lastConnectedBase');
            // Connected state comes from backend JSON - no need to set locally
          }
        } else {
          // Base not available, clear state
          console.log('[AssetConnect] Base provider not found');
          localStorage.removeItem('lastConnectedBase');
          // Connected state comes from backend JSON - no need to set locally
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
        walletId: pendingWallet.walletId,
        walletType: walletType,
      });

      console.log(`[connectAssetForWallet] Asset connected successfully: ${txHash}`);

      // Mark deposit as confirmed
      if (walletType === 'metamask') {
        // Connected state comes from backend JSON - no need to set locally
        setPendingMetaMask(null);
      } else {
        // Connected state comes from backend JSON - no need to set locally
        setPendingBase(null);
      }

      // CRITICAL: Update backend to mark deposit as completed with txHash (independent of page reloads)
      if (pendingWallet) {
        try {
          // Check if wallet extension is still connected
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
                  accounts.some((acc: string) => acc.toLowerCase() === pendingWallet.address.toLowerCase());
              } catch (e) {
                walletExtensionConnected = false;
              }
            }
          }
          
          await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: {
              address: pendingWallet.address,
              walletId: pendingWallet.walletId || '',
              walletType: walletType,
              timestamp: Date.now(),
              depositCompleted: true,
              txHash: txHash || 'unknown',
              walletExtensionConnected: walletExtensionConnected, // Preserve wallet connection status
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
      
      // CRITICAL: Reload page after successful deposit completion
      // This ensures all state is refreshed from backend JSON
      console.log('[connectAssetForWallet] Reloading page after successful deposit completion...');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('[connectAssetForWallet] Error:', error);
      console.log('[connectAssetForWallet] Error details:', {
        message: error?.message,
        code: error?.code,
        isCancelled: error?.isCancelled,
        error: error?.error
      });
      
      // Check if user cancelled the deposit
      const errorMsg = String(error?.message || error?.toString() || '');
      const isCancelled = 
        error?.isCancelled === true ||
        errorMsg.toLowerCase().includes('rejected') || 
        errorMsg.toLowerCase().includes('cancelled') || 
        errorMsg.toLowerCase().includes('user rejected') ||
        error?.code === 4001 || 
        error?.code === 'ACTION_REJECTED' ||
        error?.error?.code === 4001;
      
      if (isCancelled) {
        console.log('[connectAssetForWallet] User cancelled deposit - marking as cancelled in backend');
        
        // CRITICAL: Mark ALL pending connections for this wallet type as cancelled
        // Pass null to mark all (handles address mismatches after reload)
        if (email) {
          markPendingConnectionAsCancelled(null, walletType).catch(err => {
            console.error('[connectAssetForWallet] Error marking cancelled connection (non-blocking):', err);
          });
        }
        
        // Clear local state
        if (walletType === 'metamask') {
          setPendingMetaMask(null);
        } else {
          setPendingBase(null);
        }
        
        // Throw with a message that can be caught by VavityTester
        throw new Error('User rejected');
      }
      
      throw error;
    }
  }, [pendingMetaMask, pendingBase, email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator]);

  // Connect Asset function that handles entire connection flow (wallet connection + deposit)
  const connectAsset = useCallback(async (walletType: WalletType): Promise<void> => {
    console.log('[connectAsset] FUNCTION CALLED with walletType:', walletType, 'email:', email);
    
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
    
    console.log('[connectAsset] Setting connecting state for:', walletType);
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
      let accounts: string[] = [];
      try {
        const result = await connectWalletUtil(walletType);
        accounts = result.accounts;
      } catch (walletError: any) {
        // If user cancels wallet connection, clear state and return
        const errorMsg = String(walletError?.message || walletError?.toString() || '');
        const isCancelled = 
          errorMsg.toLowerCase().includes('cancelled') || 
          errorMsg.toLowerCase().includes('rejected') || 
          errorMsg.toLowerCase().includes('user rejected') ||
          walletError?.code === 4001 ||
          walletError?.code === 'ACTION_REJECTED';
        
        if (isCancelled) {
          console.log('User cancelled wallet connection, clearing state');
          // Reset connecting state
          if (walletType === 'metamask') {
            setIsConnectingMetaMask(false);
            setPendingMetaMask(null);
          } else {
            setIsConnectingBase(false);
            setPendingBase(null);
          }
          
          // CRITICAL: Mark ALL pending connections for this wallet type as cancelled
          // Pass null to mark all (handles address mismatches after reload)
          // This ensures button updates even if connection was saved before cancellation
          if (email) {
            markPendingConnectionAsCancelled(null, walletType).catch(err => {
              console.error('[connectAsset] Error marking cancelled connection (non-blocking):', err);
            });
          }
          
          shouldExit = true;
          return;
        }
        // Re-throw if not a cancellation
        throw walletError;
      }
      
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
      
      // CRITICAL: Save to backend JSON immediately (independent of page reloads) - this is the source of truth
      // State comes from backend JSON only - no local state setters needed
      if (typeof window !== 'undefined') {
        console.log('[connectAsset] About to save pending connection to backend:', { walletAddress, walletId, walletType, email, hasEmail: !!email });
        
        if (!email) {
          console.error('[connectAsset] ERROR: Email is not available! Cannot save pending connection to backend.');
          throw new Error('Email is required to save pending connection. Please ensure you are logged in.');
        }
        
        try {
          await savePendingConnectionToBackend(walletAddress, walletId, walletType);
          console.log('[connectAsset] Successfully saved pending connection to backend');
          
          // Trigger a refresh of backend connections to update UI immediately
          // The polling useEffect will pick it up, but we can also manually trigger it
          const backendConnections = await fetchPendingConnectionsFromBackend();
          setBackendConnections(backendConnections);
        } catch (error) {
          console.error('[connectAsset] Failed to save pending connection to backend:', error);
          // Don't throw - continue with deposit flow even if save fails
          // But log it clearly so we can debug
        }
      } else {
        console.warn('[connectAsset] window is undefined, cannot save pending connection');
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
      console.log('[connectAsset] About to trigger deposit flow for wallet:', walletAddress, walletType);
      try {
        const tokenAddress = '0x0000000000000000000000000000000000000000'; // Native ETH
        
        console.log('[connectAsset] Calling connectAssetUtil with:', {
          walletAddress,
          walletType,
          walletId,
          email,
          hasProvider: !!provider
        });
        
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
            walletId: walletId,
          walletType: walletType,
        });
        
        console.log('[connectAsset] Deposit flow completed successfully:', { txHash, hasReceipt: !!receipt });
        
        // Mark deposit as confirmed
        if (walletType === 'metamask') {
          // Connected/pending state comes from backend JSON - no need to set locally
        } else {
          // Connected/pending state comes from backend JSON - no need to set locally
        }
        
        // CRITICAL: Update backend to mark deposit as completed with txHash (independent of page reloads)
        try {
          // Check if wallet extension is still connected
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
              walletId: walletId || '',
              walletType: walletType,
              timestamp: Date.now(),
              depositCompleted: true,
              txHash: txHash || 'unknown',
              walletExtensionConnected: walletExtensionConnected, // Preserve wallet connection status
            },
          });
          console.log('[AssetConnect] Marked deposit as completed in backend - keeping connection in JSON');
        } catch (error) {
          console.error('[AssetConnect] Error updating pending connection in backend:', error);
        }
        
        // CRITICAL: DO NOT remove completed connections - keep them in JSON with depositCompleted: true
        // This allows state to persist across reloads and button to show "CONNECTED" state
        
        // Clear pending wallet flags
        
        // CRITICAL: Reload page after successful wallet connection and deposit
        // This ensures all state is refreshed from backend JSON
        console.log('[connectAsset] Reloading page after successful wallet connection and deposit...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
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
          console.log('[connectAsset] User cancelled deposit - clearing state immediately');
          
          // CRITICAL: Clear state FIRST (immediate button update) - ALWAYS, regardless of backend
          // Reset connecting state immediately
          if (walletType === 'metamask') {
            setIsConnectingMetaMask(false);
            setPendingMetaMask(null);
          } else {
            setIsConnectingBase(false);
            setPendingBase(null);
          }
          
          // CRITICAL: Get address from backend pending connection if walletAddress isn't available
          // This handles the case where user cancels after page reload
          let addressToCancel = walletAddress;
          if (!addressToCancel && email) {
            try {
              const response = await axios.get('/api/savePendingConnection', { params: { email } });
              const pendingConnections = response.data.pendingConnections || [];
              const pendingConn = pendingConnections.find(
                (pc: any) => pc.walletType === walletType && !pc.depositCancelled && !pc.depositCompleted
              );
              if (pendingConn) {
                addressToCancel = pendingConn.address;
                console.log('[connectAsset] Found address from backend pending connection:', addressToCancel);
        }
            } catch (err) {
              console.error('[connectAsset] Error fetching pending connection for cancellation:', err);
            }
          }
          
          // Set cancellation refs IMMEDIATELY to prevent any re-processing
          // This works even if backend update fails
          if (addressToCancel) {
            lastCancelledAddressRef.current = addressToCancel.toLowerCase();
          }
          lastCancelledTypeRef.current = walletType;
          lastCancelledTimestampRef.current = Date.now();
          
          // CRITICAL: Mark ALL pending connections for this wallet type as cancelled
          // Pass null if address not found - this will mark ALL connections for this wallet type
          // This ensures cancellation is detected even if address doesn't match
          markPendingConnectionAsCancelled(addressToCancel || null, walletType).catch(err => {
            console.error('[connectAsset] Error marking cancelled connection (non-blocking):', err);
          });
          
          // Remove from backend after delay (non-blocking)
          // Keep it longer (30 seconds) so checkPending can detect cancellation after reload
          setTimeout(async () => {
            try {
              await removePendingConnectionFromBackend(walletAddress, walletType);
            } catch (err) {
              console.error('[connectAsset] Error removing cancelled connection:', err);
            }
          }, 30000); // Increased to 30 seconds to allow checkPending to detect cancellation after reload
          
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
      
      // CRITICAL: Reset connecting state FIRST (so button updates immediately)
      if (walletType === 'metamask') {
        setIsConnectingMetaMask(false);
      } else {
        setIsConnectingBase(false);
      }
      
      // If user cancelled, clear pending wallet state silently (no alert)
      if (isCancelled) {
        console.log('User cancelled wallet connection/deposit in connectAsset, clearing all state and marking as cancelled in backend');
        
        // Clear pending state immediately
        if (walletType === 'metamask') {
          setPendingMetaMask(null);
        } else {
          setPendingBase(null);
        }
        
        // CRITICAL: Get address from backend pending connection if not available from error/localStorage
        // This handles the case where user cancels after page reload
        let walletAddressFromError = error?.walletAddress || (typeof window !== 'undefined' && localStorage.getItem(walletType === 'metamask' ? 'lastConnectedMetaMask' : 'lastConnectedBase'));
        
        if (!walletAddressFromError && email) {
          try {
            const response = await axios.get('/api/savePendingConnection', { params: { email } });
            const pendingConnections = response.data.pendingConnections || [];
            const pendingConn = pendingConnections.find(
              (pc: any) => pc.walletType === walletType && !pc.depositCancelled && !pc.depositCompleted
            );
            if (pendingConn) {
              walletAddressFromError = pendingConn.address;
              console.log('[connectAsset] Found address from backend pending connection:', walletAddressFromError);
            }
          } catch (err) {
            console.error('[connectAsset] Error fetching pending connection for cancellation:', err);
          }
        }
        
        if (email) {
          // Set cancellation refs IMMEDIATELY to prevent any re-processing
          if (walletAddressFromError) {
            lastCancelledAddressRef.current = walletAddressFromError.toLowerCase();
            lastCancelledTypeRef.current = walletType;
            lastCancelledTimestampRef.current = Date.now();
          }
          
          // Mark ALL pending connections for this wallet type as cancelled (address can be null to mark all)
          // This ensures we catch the cancellation even if address doesn't match
          markPendingConnectionAsCancelled(walletAddressFromError || null, walletType).catch(err => {
            console.error('[connectAsset] Error marking cancelled connection (non-blocking):', err);
          });
          
          // Remove from backend after delay (non-blocking)
          if (walletAddressFromError) {
            setTimeout(async () => {
              try {
                await removePendingConnectionFromBackend(walletAddressFromError, walletType);
              } catch (err) {
                console.error('[connectAsset] Error removing cancelled connection:', err);
              }
            }, 30000); // Increased to 30 seconds to allow checkPending to detect cancellation after reload
          }
        }
        
        // Also clear localStorage if wallet connection was cancelled (before deposit)
        if (typeof window !== 'undefined') {
          if (walletType === 'metamask') {
            localStorage.removeItem('lastConnectedMetaMask');
          } else {
            localStorage.removeItem('lastConnectedBase');
          }
        }
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

