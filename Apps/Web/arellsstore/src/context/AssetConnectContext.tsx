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
  
  // Currently connecting state (derived from JSON)
  isConnectingMetaMask: boolean;
  isConnectingBase: boolean;
  
  // Connected wallets state (after successful connection AND deposit confirmation)
  connectedMetaMask: boolean;
  connectedBase: boolean;
  
  // Pending wallets that need deposit (wallet connected but deposit not confirmed)
  pendingMetaMask: { address: string; walletId: string } | null;
  pendingBase: { address: string; walletId: string } | null;
  
  // JSON boolean states for MetaMask (derived from backendConnections)
  metaMaskWalletConnected: boolean;
  metaMaskAssetConnected: boolean;
  
  // JSON boolean states for Base (derived from backendConnections)
  baseWalletConnected: boolean;
  baseAssetConnected: boolean;
  
  // Connect Asset: Handles wallet connection, deposit, and fetches balances
  connectAsset: (walletType: WalletType) => Promise<void>;
  
  // Connect Asset for pending wallet: Handles deposit and fetches balances for pending wallet
  connectAssetForWallet: (walletType: WalletType) => Promise<void>;
  
  // Clear auto-connected wallets (when user disconnects)
  clearAutoConnectedMetaMask: () => void;
  clearAutoConnectedBase: () => void;
  
  setPendingMetaMask: (wallet: { address: string; walletId: string } | null) => void;
  setPendingBase: (wallet: { address: string; walletId: string } | null) => void;
  
}

const AssetConnectContext = createContext<AssetConnectContextType | undefined>(undefined);

export const AssetConnectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoConnectedMetaMask, setAutoConnectedMetaMask] = useState<string | null>(null);
  const [autoConnectedBase, setAutoConnectedBase] = useState<string | null>(null);
  // isConnectingMetaMask and isConnectingBase are now derived from backendConnections (see useMemo below)
  
  // Store backend connections and compute pending/connected from them
  // CRITICAL: Initialize as empty array - will be populated from backend on mount
  // If page reloads before backend saves optimistic update, this ensures buttons reset correctly
  const [backendConnections, setBackendConnections] = useState<any[]>([]);
  
  // Track last fetched JSON to detect actual changes in backend
  // Only process JSON if it's different from what we last fetched
  const lastFetchedJsonRef = React.useRef<string>('');
  
  // Computed values from backend JSON (derived, not stored in state)
  // Simplified to only use: assetConnected, walletConnected, walletConnecting, assetConnecting
  const pendingMetaMask = React.useMemo(() => {
    const activePending = backendConnections.filter((pc: any) => 
      !pc.assetConnected && pc.walletType === 'metamask'
    );
    const conn = activePending[0];
    return conn ? { address: conn.address, walletId: conn.walletId } : null;
  }, [backendConnections]);
  
  const pendingBase = React.useMemo(() => {
    const activePending = backendConnections.filter((pc: any) => 
      !pc.assetConnected && pc.walletType === 'base'
    );
    const conn = activePending[0];
    return conn ? { address: conn.address, walletId: conn.walletId } : null;
  }, [backendConnections]);
  
  const connectedMetaMask = React.useMemo(() => {
    return backendConnections.some((pc: any) => 
      pc.walletType === 'metamask' && pc.assetConnected
    );
  }, [backendConnections]);
  
  const connectedBase = React.useMemo(() => {
    return backendConnections.some((pc: any) => 
      pc.walletType === 'base' && pc.assetConnected
    );
  }, [backendConnections]);
  
  // Derived connecting states - removed (no longer tracking connecting state)
  const isConnectingMetaMask = false;
  const isConnectingBase = false;
  
  // Derived JSON boolean states for MetaMask
  // Return the most recent connection
  const metaMaskConn = React.useMemo(() => {
    const metamaskConnections = backendConnections.filter((pc: any) => pc.walletType === 'metamask');
    if (metamaskConnections.length === 0) return undefined;
    if (metamaskConnections.length === 1) return metamaskConnections[0];
    
    // Return the most recent one (highest timestamp)
    return metamaskConnections.reduce((latest, current) => 
      (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
    );
  }, [backendConnections]);
  
  const metaMaskWalletConnected = metaMaskConn?.walletConnected ?? false;
  const metaMaskAssetConnected = metaMaskConn?.assetConnected ?? false;
  
  // Derived JSON boolean states for Base
  // Return the most recent connection
  const baseConn = React.useMemo(() => {
    const baseConnections = backendConnections.filter((pc: any) => pc.walletType === 'base');
    if (baseConnections.length === 0) return undefined;
    if (baseConnections.length === 1) return baseConnections[0];
    
    // Return the most recent one (highest timestamp)
    return baseConnections.reduce((latest, current) => 
      (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
    );
  }, [backendConnections]);
  
  const baseWalletConnected = baseConn?.walletConnected ?? false;
  const baseAssetConnected = baseConn?.assetConnected ?? false;
  
  // Get VavityAggregator context for wallet operations (must be before callbacks that use email)
  const { email, assetPrice, vapa, addVavityAggregator, fetchVavityAggregator, saveVavityAggregator } = useVavity();
  
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
  
  // Track optimistic updates to prevent flickering
  // Key insight: We need to match optimistic updates with backend confirmations using exact state comparison
  // Instead of merging, we completely skip backend updates until backend confirms the optimistic state
  // Status tracking: 'pending' → 'sent' → 'confirmed'
  // - 'pending': Optimistic update made, API call not started yet
  // - 'sent': API call succeeded, backend received it (but S3 might not be ready yet)
  // - 'confirmed': Polling confirmed backend has the update
  const optimisticUpdateRef = React.useRef<{
    walletType: 'metamask' | 'base' | null;
    field: string;
    expectedValue: boolean; // The value we optimistically set
    optimisticState: any; // The exact state we set optimistically (for comparison)
    status: 'pending' | 'sent' | 'confirmed'; // Track status of optimistic update
    timestamp: number; // When optimistic update was made
    sentAt?: number; // When API call succeeded (status = 'sent')
  } | null>(null);
  
  // setIsConnectingMetaMask and setIsConnectingBase removed - walletConnecting and assetConnecting booleans removed from JSON
  const setIsConnectingMetaMask = useCallback(async (isConnecting: boolean) => {
    // Stub - no longer used (walletConnecting and assetConnecting removed from JSON)
    return;
  }, [email]);
  
  const setIsConnectingBase = useCallback(async (isConnecting: boolean) => {
    // Stub - no longer used (walletConnecting and assetConnecting removed from JSON)
    return;
  }, [email]);
  
  // Remove ref update for setIsConnectingBase - no longer needed
  
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
      // Get existing connection to preserve boolean states
      let existingConnection: any = null;
      try {
        const getResponse = await axios.get('/api/savePendingConnection', { params: { email } });
        const existingConnections = getResponse.data.pendingConnections || [];
        existingConnection = existingConnections.find(
          (pc: any) => pc.walletType === walletType && pc.address.toLowerCase() === address.toLowerCase()
        );
      
      // Update MetaMask connection walletConnecting boolean only
      if (metamaskConn) {
        const updatedMetaMask = {
          ...metamaskConn,
          walletConnecting: isConnecting ? (!metamaskConn.walletConnected) : false,
        };
        updated = updated.filter((pc: any) => !(pc.walletType === 'metamask' && pc.address === metamaskConn.address));
        updated.push(updatedMetaMask);
      } else {
        // If MetaMask connection doesn't exist, create it
        const tempAddress = '0x0000000000000000000000000000000000000000';
        const now = Date.now();
        const newMetaMaskConnection = {
          address: tempAddress,
          walletId: `temp-connecting-metamask-${now}`,
          walletType: 'metamask' as const,
          timestamp: now,
          walletConnected: false,
          walletConnecting: isConnecting,
          assetConnected: false,
          assetConnecting: false,
        };
        updated.push(newMetaMaskConnection);
      }
      
      // Ensure Base connection exists (but don't update its walletConnecting boolean)
      if (!baseConn) {
        const tempAddress = '0x0000000000000000000000000000000000000000';
        const now = Date.now();
        const newBaseConnection = {
          address: tempAddress,
          walletId: `temp-connecting-base-${now + 1}`,
          walletType: 'base' as const,
          timestamp: now + 1,
          walletConnected: false,
          walletConnecting: false, // Keep Base walletConnecting as false (independent)
          assetConnected: false,
          assetConnecting: false,
        };
        updated.push(newBaseConnection);
      }
      
      console.log('[AssetConnect setIsConnectingMetaMask] Optimistic update - MetaMask walletConnecting updated, Base connection ensured:', {
        isConnecting,
        metamask: metamaskConn ? { walletId: metamaskConn.walletId, walletConnecting: isConnecting ? (!metamaskConn.walletConnected) : false } : 'created new',
        base: baseConn ? { walletId: baseConn.walletId, walletConnecting: baseConn.walletConnecting } : 'created new (walletConnecting: false)'
      });
      
      return updated;
    });
    
    // Now do API calls - AWAIT to ensure they complete
    // This ensures the JSON is created before the wallet connection proceeds
    // DECOUPLED: Only update MetaMask walletConnecting boolean, but ensure BOTH connections exist
    const backendUpdatePromise = (async () => {
      console.log('[AssetConnect setIsConnectingMetaMask] 🚀 Starting async backend update (MetaMask walletConnecting only, but ensure both exist), isConnecting:', isConnecting, 'email:', email);
      let metamaskConn: any = null;
      let baseConn: any = null;
      
      // Try to fetch existing connections, but continue even if it fails
      // CRITICAL: If JSON doesn't exist or GET fails, treat as "no connections exist" and create both
      // The email is available from function parameter, not from GET response, so it's always available
      try {
        console.log('[AssetConnect setIsConnectingMetaMask] 📡 Fetching existing connections from API...', 'email:', email);
        if (!email) {
          console.error('[AssetConnect setIsConnectingMetaMask] ❌ No email available - cannot create connections');
          throw new Error('Email is required');
        }
        
        const getPromise = axios.get('/api/savePendingConnection', { 
          params: { email },
          timeout: 1000 // 1 second timeout - very short to avoid delays
        });
        const response = await getPromise;
        console.log('[AssetConnect setIsConnectingMetaMask] ✅ GET request succeeded, status:', response.status);
        const existingConnections = response.data.pendingConnections || [];
        console.log('[AssetConnect setIsConnectingMetaMask] ✅ Fetched existing connections:', {
          total: existingConnections.length,
          connections: existingConnections.map((pc: any) => ({
            walletType: pc.walletType,
            walletId: pc.walletId,
            address: pc.address,
            walletConnecting: pc.walletConnecting
          }))
        });
        
        // Find both MetaMask and Base connections (both should exist)
        const metamaskConnections = existingConnections.filter((pc: any) => pc.walletType === 'metamask');
        const baseConnections = existingConnections.filter((pc: any) => pc.walletType === 'base');
        console.log('[AssetConnect setIsConnectingMetaMask] Filtered connections:', {
          metamaskCount: metamaskConnections.length,
          baseCount: baseConnections.length
        });
        
        // Find MetaMask connection
        // CRITICAL: When isConnecting is false (cancellation), find ANY connection to update (not just active ones)
        // When isConnecting is true, prefer active connection
        if (metamaskConnections.length > 0) {
          if (isConnecting) {
            // When connecting, prefer active connection
            const activeConn = metamaskConnections.find((pc: any) => pc.walletConnecting === true);
            if (activeConn) {
              metamaskConn = activeConn;
            } else {
              metamaskConn = metamaskConnections.reduce((latest, current) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
              );
            }
          } else {
            // When cancelling (isConnecting is false), find ANY connection to update
            // Prefer active ones first, but if none exist, use the most recent one
            const activeConn = metamaskConnections.find((pc: any) => pc.walletConnecting === true);
            if (activeConn) {
              metamaskConn = activeConn;
            } else {
              // No active connection - use most recent one to update
              metamaskConn = metamaskConnections.reduce((latest, current) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
              );
            }
          }
        }
        
      } catch (error: any) {
        // GET failed (timeout, 401, 500, NoSuchKey, etc.) - try to use current backendConnections state as fallback
        // CRITICAL: Email is still available from function parameter, not from GET response
        const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');
        const isFileNotFound = error?.response?.status === 404 || error?.code === 'NoSuchKey';
        
        console.log('[AssetConnect setIsConnectingMetaMask] ⚠️ GET request failed, trying to use current backendConnections state as fallback:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          message: error?.message,
          code: error?.code,
          isTimeout,
          isFileNotFound,
          email: email, // Email is still available - it's from function parameter
          backendConnectionsCount: backendConnections.length
        });
        
        // CRITICAL: If GET fails but we have connections in state, use them as fallback
        // This handles the case where page reloaded and GET times out, but state still has connections
        // Find both MetaMask and Base connections
        if (backendConnections.length > 0) {
          console.log('[AssetConnect setIsConnectingMetaMask] ✅ Using backendConnections state as fallback (GET failed but state has connections)');
          const metamaskConnections = backendConnections.filter((pc: any) => pc.walletType === 'metamask');
          const baseConnections = backendConnections.filter((pc: any) => pc.walletType === 'base');
          
          // Find MetaMask connection from state
          if (metamaskConnections.length > 0) {
            if (isConnecting) {
              const activeConn = metamaskConnections.find((pc: any) => pc.walletConnecting === true);
              if (activeConn) {
                metamaskConn = activeConn;
              } else {
                metamaskConn = metamaskConnections.reduce((latest, current) => 
                  (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
                );
              }
            } else {
              // When cancelling, find ANY connection to update
              const activeConn = metamaskConnections.find((pc: any) => pc.walletConnecting === true);
              if (activeConn) {
                metamaskConn = activeConn;
              } else {
                metamaskConn = metamaskConnections.reduce((latest, current) => 
                  (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
                );
              }
            }
          }
          
          // Find Base connection from state (to ensure it exists)
          if (baseConnections.length > 0) {
            baseConn = baseConnections.reduce((latest, current) => 
              (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
            );
          }
          
          console.log('[AssetConnect setIsConnectingMetaMask] ✅ Fallback complete - metamaskConn exists:', !!metamaskConn, 'baseConn exists:', !!baseConn);
        } else {
          console.log('[AssetConnect setIsConnectingMetaMask] ⚠️ No connections in state either - will create both connections');
          // Both will be created
        }
        // Email is still available from the function parameter, so we can create/update connections
      }
      
      console.log('[AssetConnect setIsConnectingMetaMask] 🔍 After filtering - metamaskConn exists:', !!metamaskConn, 'baseConn exists:', !!baseConn);
      console.log('[AssetConnect setIsConnectingMetaMask] 🔄 Continuing to create/update connections (GET completed or failed)...');
      
      // CRITICAL: If metamaskConn is null and isConnecting is false (cancellation), try multiple times to fetch from backend
      // This ensures we find the existing MetaMask connection to update after a reload
      if (!metamaskConn && !isConnecting) {
        console.log('[AssetConnect setIsConnectingMetaMask] ⚠️ MetaMask connection not found but cancelling - trying multiple methods to find it');
        
        // Method 1: Try GET request with retry
        try {
          const retryResponse = await axios.get('/api/savePendingConnection', { 
            params: { email },
            timeout: 2000 // Increased timeout for cancellation
          });
          const retryConnections = retryResponse.data.pendingConnections || [];
          const metamaskConnections = retryConnections.filter((pc: any) => pc.walletType === 'metamask');
          if (metamaskConnections.length > 0) {
            // Find any MetaMask connection to update (prefer active one with walletConnecting: true)
            const activeConn = metamaskConnections.find((pc: any) => pc.walletConnecting === true);
            metamaskConn = activeConn || metamaskConnections.reduce((latest, current) => 
              (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
            );
            console.log('[AssetConnect setIsConnectingMetaMask] ✅ Found MetaMask connection on GET retry:', !!metamaskConn, 'walletConnecting:', metamaskConn?.walletConnecting);
          }
        } catch (retryErr: any) {
          console.log('[AssetConnect setIsConnectingMetaMask] ⚠️ GET retry failed:', retryErr?.response?.status || retryErr.message);
        }
        
        // Method 2: If still not found, try backendConnections state (might have synced by now)
        if (!metamaskConn && backendConnections.length > 0) {
          console.log('[AssetConnect setIsConnectingMetaMask] 🔍 Trying backendConnections state (length:', backendConnections.length, ')');
          const metamaskConnections = backendConnections.filter((pc: any) => pc.walletType === 'metamask');
          if (metamaskConnections.length > 0) {
            // Prefer connection with walletConnecting: true, otherwise get latest
            const activeConn = metamaskConnections.find((pc: any) => pc.walletConnecting === true);
            metamaskConn = activeConn || metamaskConnections.reduce((latest, current) => 
              (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
            );
            console.log('[AssetConnect setIsConnectingMetaMask] ✅ Found MetaMask connection in backendConnections state:', !!metamaskConn, 'walletConnecting:', metamaskConn?.walletConnecting);
          }
        }
        
        // Method 3: If still not found, wait a bit and try one more GET (backend might still be syncing)
        if (!metamaskConn) {
          console.log('[AssetConnect setIsConnectingMetaMask] ⏳ Connection still not found, waiting 500ms and trying one more GET...');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            const finalRetryResponse = await axios.get('/api/savePendingConnection', { 
              params: { email },
              timeout: 2000
            });
            const finalRetryConnections = finalRetryResponse.data.pendingConnections || [];
            const finalMetamaskConnections = finalRetryConnections.filter((pc: any) => pc.walletType === 'metamask');
            if (finalMetamaskConnections.length > 0) {
              const activeConn = finalMetamaskConnections.find((pc: any) => pc.walletConnecting === true);
              metamaskConn = activeConn || finalMetamaskConnections.reduce((latest, current) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
              );
              console.log('[AssetConnect setIsConnectingMetaMask] ✅ Found MetaMask connection on final GET retry:', !!metamaskConn, 'walletConnecting:', metamaskConn?.walletConnecting);
            }
          } catch (finalRetryErr: any) {
            console.log('[AssetConnect setIsConnectingMetaMask] ⚠️ Final GET retry also failed:', finalRetryErr?.response?.status || finalRetryErr.message);
          }
        }
      }
      
      // CRITICAL: Ensure BOTH MetaMask AND Base connections exist
      // But only update MetaMask walletConnecting boolean (Base stays independent)
      const tempAddress = '0x0000000000000000000000000000000000000000';
      const now = Date.now();
      
      console.log('[AssetConnect setIsConnectingMetaMask] 📝 About to update/create connections - MetaMask exists:', !!metamaskConn, 'Base exists:', !!baseConn);
      
      try {
        // Update or create MetaMask connection FIRST
        if (metamaskConn) {
          // Update existing MetaMask connection
          console.log('[AssetConnect setIsConnectingMetaMask] 🔄 Updating existing MetaMask connection');
          // CRITICAL: When isConnecting is false, set walletConnecting to false (don't use && logic)
          const updatedMetaMask = {
            ...metamaskConn,
            walletConnecting: isConnecting ? (!metamaskConn.walletConnected) : false, // If isConnecting is false, always set to false
          };
          console.log('[AssetConnect setIsConnectingMetaMask] 📤 POST /api/savePendingConnection for MetaMask (update) - isConnecting:', isConnecting, 'walletConnecting will be:', updatedMetaMask.walletConnecting);
          const metaMaskResponse = await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: updatedMetaMask,
          });
          console.log('[AssetConnect] ✅ Backend updated MetaMask - Response status:', metaMaskResponse.status, 'walletConnecting:', updatedMetaMask.walletConnecting);
        } else {
          // Create new MetaMask connection (only if isConnecting is true)
          if (isConnecting) {
            console.log('[AssetConnect setIsConnectingMetaMask] ➕ Creating new MetaMask connection');
            const newMetaMaskConnection = {
              address: tempAddress,
              walletId: `temp-init-metamask-${now}`,
              walletType: 'metamask' as const,
              timestamp: now,
              walletConnected: false,
              walletConnecting: isConnecting,
              assetConnected: false,
              assetConnecting: false,
            };
            console.log('[AssetConnect setIsConnectingMetaMask] 📤 POST /api/savePendingConnection for MetaMask (new) - Connection data:', newMetaMaskConnection);
            try {
              const metaMaskResponse = await axios.post('/api/savePendingConnection', {
                email,
                pendingConnection: newMetaMaskConnection,
              });
              console.log('[AssetConnect] ✅ Backend created MetaMask connection - Response status:', metaMaskResponse.status, 'walletConnecting:', isConnecting);
            } catch (metaErr: any) {
              console.error('[AssetConnect] ❌ Error creating MetaMask connection:', metaErr?.response?.status || metaErr.message);
              // Don't throw - continue to ensure Base connection exists
              console.log('[AssetConnect] ⚠️ Continuing to ensure Base connection exists despite MetaMask error');
            }
          } else {
            // Cancelling but MetaMask connection not found after all retries
            // CRITICAL: Create a new connection with walletConnecting: false to ensure state is correct
            // This handles the edge case where the connection exists in backend but we can't fetch it
            console.log('[AssetConnect setIsConnectingMetaMask] ⚠️ Cancelling but MetaMask connection not found after all retries - creating new connection with walletConnecting: false to ensure state is correct');
            const cancelMetaMaskConnection = {
              address: tempAddress,
              walletId: `temp-cancel-metamask-${now}`,
              walletType: 'metamask' as const,
              timestamp: now,
              walletConnected: false,
              walletConnecting: false, // CRITICAL: Set to false for cancellation
              assetConnected: false,
              assetConnecting: false,
            };
            try {
              const cancelResponse = await axios.post('/api/savePendingConnection', {
                email,
                pendingConnection: cancelMetaMaskConnection,
              });
              console.log('[AssetConnect setIsConnectingMetaMask] ✅ Created cancellation connection - Response status:', cancelResponse.status);
            } catch (cancelErr: any) {
              console.error('[AssetConnect setIsConnectingMetaMask] ❌ Error creating cancellation connection:', cancelErr?.response?.status || cancelErr.message);
              // Don't throw - continue to ensure Base connection exists
            }
          }
        }
        
        // Ensure Base connection exists (but don't update its walletConnecting boolean)
        if (baseConn) {
          // Base connection exists - no need to update it (walletConnecting stays independent)
          console.log('[AssetConnect setIsConnectingMetaMask] ✅ Base connection already exists, no update needed (walletConnecting stays independent)');
        } else {
          // Create Base connection if it doesn't exist
          console.log('[AssetConnect setIsConnectingMetaMask] ➕ Creating Base connection (not found in backend)');
          const newBaseConnection = {
            address: tempAddress,
            walletId: `temp-init-base-${now + 1}`,
            walletType: 'base' as const,
            timestamp: now + 1,
            walletConnected: false,
            walletConnecting: false, // Keep Base walletConnecting as false (independent)
            assetConnected: false,
            assetConnecting: false,
          };
          console.log('[AssetConnect setIsConnectingMetaMask] 📤 POST /api/savePendingConnection for Base (new) - walletConnecting will be false');
          try {
            const baseResponse = await axios.post('/api/savePendingConnection', {
              email,
              pendingConnection: newBaseConnection,
            });
            console.log('[AssetConnect] ✅ Backend created Base connection - Response status:', baseResponse.status, 'walletConnecting: false (independent)');
          } catch (baseErr: any) {
            console.error('[AssetConnect] ❌ Error creating Base connection:', baseErr?.response?.status || baseErr.message);
            // Don't throw - MetaMask was updated successfully
          }
        }
        
        console.log('[AssetConnect setIsConnectingMetaMask] ✅ Both connections ensured, MetaMask walletConnecting updated');
        // API succeeded - mark as "sent"
        if (optimisticUpdateRef.current) {
          optimisticUpdateRef.current.status = 'sent';
          optimisticUpdateRef.current.sentAt = Date.now();
          console.log('[AssetConnect setIsConnectingMetaMask] ✅ Marked optimistic update as "sent" - backend sync can now proceed');
        }
        console.log('[AssetConnect] ✅ Backend updated/created - MetaMask walletConnecting:', isConnecting, 'Base connection ensured (walletConnecting independent)', {
          hadMetaMask: !!metamaskConn,
          hadBase: !!baseConn,
        });
      } catch (apiError: any) {
        console.error('[AssetConnect] ❌ Error updating/creating backend connections:', apiError);
        console.error('[AssetConnect] ❌ Error details:', {
          message: apiError?.message,
          status: apiError?.response?.status,
          statusText: apiError?.response?.statusText,
          data: apiError?.response?.data,
          url: apiError?.config?.url,
          method: apiError?.config?.method,
          whichConnection: apiError?.config?.data ? JSON.parse(apiError?.config?.data)?.pendingConnection?.walletType : 'unknown'
        });
        // Clear optimistic update on error - allow sync to proceed with whatever is in backend
        optimisticUpdateRef.current = null;
        // Re-throw so caller knows it failed
        throw apiError;
      }
    })();
    
    // AWAIT the promise to ensure backend update completes before function returns
    // This is critical for cancellation - we need to wait for walletConnecting to be set to false
    // CRITICAL: This ensures ALL wallet connections and optimistic updates are done before allowing sync
    try {
      await backendUpdatePromise;
      console.log('[AssetConnect setIsConnectingMetaMask] ✅ Backend update promise completed - MetaMask connection created/updated, optimistic update marked as "sent"');
      console.log('[AssetConnect setIsConnectingMetaMask] ✅ syncStateFromBackend can now safely read from backend');
    } catch (error: any) {
      console.error('[AssetConnect setIsConnectingMetaMask] ❌ Backend update promise failed:', error);
      console.error('[AssetConnect setIsConnectingMetaMask] ❌ This means one or both connections failed to create/update');
      // Clear optimistic update on error - allow sync to proceed
      optimisticUpdateRef.current = null;
      // Don't throw - optimistic update already applied, so UI is correct
      // But log the error so we can debug why Base connection isn't being created
    }
  }, [email, backendConnections]); // Include backendConnections for fallback when GET fails
  
  // DECOUPLED: Only handles Base connection - MetaMask is handled independently
  const setIsConnectingBase = useCallback(async (isConnecting: boolean) => {
    if (!email) return;
    
    // CRITICAL: Do optimistic update (synchronously) before any async operations
    // This ensures instant UI feedback
    // DECOUPLED: Only update Base walletConnecting boolean, but ensure BOTH connections exist
    let optimisticValue = false;
    setBackendConnections((prev: any[]) => {
      // Find both MetaMask and Base connections (both should exist)
      const metamaskConnections = prev.filter((pc: any) => pc.walletType === 'metamask');
      const baseConnections = prev.filter((pc: any) => pc.walletType === 'base');
      
      let metamaskConn: any = null;
      let baseConn: any = null;
      
      // Find MetaMask connection (to ensure it exists, but don't update its walletConnecting)
      if (metamaskConnections.length > 0) {
        metamaskConn = metamaskConnections.reduce((latest, current) => 
          (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
        );
      }
      
      // Find Base connection
      if (baseConnections.length > 0) {
        const activeConn = baseConnections.find((pc: any) => pc.walletConnecting === true);
        if (activeConn) {
          baseConn = activeConn;
        } else {
          baseConn = baseConnections.reduce((latest, current) => 
            (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
          );
        }
      }
      
      // Calculate optimistic value now that we have baseConn
      optimisticValue = isConnecting ? (!baseConn?.walletConnected) : false;
      
      // CRITICAL: Set optimistic update ref INSIDE setState to ensure we have baseConn
      optimisticUpdateRef.current = {
        walletType: 'base',
        field: 'walletConnecting',
        expectedValue: optimisticValue,
        optimisticState: optimisticValue,
        status: 'pending',
        timestamp: Date.now()
      };
      
      let updated = [...prev];
      
      // Update Base connection walletConnecting boolean only
      if (baseConn) {
        const updatedBase = {
          ...baseConn,
          walletConnecting: isConnecting ? (!baseConn.walletConnected) : false,
        };
        updated = updated.filter((pc: any) => !(pc.walletType === 'base' && pc.address === baseConn.address));
        updated.push(updatedBase);
      } else {
        // If Base connection doesn't exist, create it
        const tempAddress = '0x0000000000000000000000000000000000000000';
        const now = Date.now();
        const newBaseConnection = {
          address: tempAddress,
          walletId: `temp-connecting-base-${now}`,
          walletType: 'base' as const,
          timestamp: now,
          walletConnected: false,
          walletConnecting: isConnecting,
          assetConnected: false,
          assetConnecting: false,
        };
        updated.push(newBaseConnection);
      }
      
      // Ensure MetaMask connection exists (but don't update its walletConnecting boolean)
      if (!metamaskConn) {
        const tempAddress = '0x0000000000000000000000000000000000000000';
        const now = Date.now();
        const newMetaMaskConnection = {
          address: tempAddress,
          walletId: `temp-connecting-metamask-${now + 1}`,
          walletType: 'metamask' as const,
          timestamp: now + 1,
          walletConnected: false,
          walletConnecting: false, // Keep MetaMask walletConnecting as false (independent)
          assetConnected: false,
          assetConnecting: false,
        };
        updated.push(newMetaMaskConnection);
      }
      
      console.log('[AssetConnect setIsConnectingBase] Optimistic update - Base walletConnecting updated, MetaMask connection ensured:', {
        isConnecting,
        base: baseConn ? { walletId: baseConn.walletId, walletConnecting: isConnecting ? (!baseConn.walletConnected) : false } : 'created new',
        metamask: metamaskConn ? { walletId: metamaskConn.walletId, walletConnecting: metamaskConn.walletConnecting } : 'created new (walletConnecting: false)'
      });
      
      return updated;
    });
    
    // Now do API calls - AWAIT to ensure they complete
    // DECOUPLED: Only update Base walletConnecting boolean, but ensure BOTH connections exist
    const backendUpdatePromise = (async () => {
      console.log('[AssetConnect setIsConnectingBase] 🚀 Starting async backend update (Base walletConnecting only, but ensure both exist), isConnecting:', isConnecting, 'email:', email);
      let metamaskConn: any = null;
      let baseConn: any = null;
      
      // Try to fetch existing connections, but continue even if it fails
      try {
        console.log('[AssetConnect setIsConnectingBase] 📡 Fetching existing connections from API...', 'email:', email);
        if (!email) {
          console.error('[AssetConnect setIsConnectingBase] ❌ No email available - cannot create connections');
          throw new Error('Email is required');
        }
        
        const getPromise = axios.get('/api/savePendingConnection', { 
          params: { email },
          timeout: 1000
        });
        const response = await getPromise;
        console.log('[AssetConnect setIsConnectingBase] ✅ GET request succeeded, status:', response.status);
        const existingConnections = response.data.pendingConnections || [];
        
        // Find both MetaMask and Base connections (both should exist)
        const metamaskConnections = existingConnections.filter((pc: any) => pc.walletType === 'metamask');
        const baseConnections = existingConnections.filter((pc: any) => pc.walletType === 'base');
        console.log('[AssetConnect setIsConnectingBase] Filtered connections:', {
          metamaskCount: metamaskConnections.length,
          baseCount: baseConnections.length
        });
        
        // Find Base connection
        if (baseConnections.length > 0) {
          if (isConnecting) {
            const activeConn = baseConnections.find((pc: any) => pc.walletConnecting === true);
            if (activeConn) {
              baseConn = activeConn;
            } else {
              baseConn = baseConnections.reduce((latest, current) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
              );
            }
          } else {
            // When cancelling, find ANY connection to update
            const activeConn = baseConnections.find((pc: any) => pc.walletConnecting === true);
            if (activeConn) {
              baseConn = activeConn;
            } else {
              baseConn = baseConnections.reduce((latest, current) => 
                (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
              );
            }
          }
        }
        
        // Find MetaMask connection (to ensure it exists, but don't update its walletConnecting)
        if (metamaskConnections.length > 0) {
          metamaskConn = metamaskConnections.reduce((latest, current) => 
            (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
          );
        }
      } catch (error: any) {
        // GET failed - try to use current backendConnections state as fallback
        console.log('[AssetConnect setIsConnectingBase] ⚠️ GET request failed, trying to use current backendConnections state as fallback');
        
        if (backendConnections.length > 0) {
          const metamaskConnections = backendConnections.filter((pc: any) => pc.walletType === 'metamask');
          const baseConnections = backendConnections.filter((pc: any) => pc.walletType === 'base');
          
          // Find Base connection from state
          if (baseConnections.length > 0) {
            if (isConnecting) {
              const activeConn = baseConnections.find((pc: any) => pc.walletConnecting === true);
              if (activeConn) {
                baseConn = activeConn;
              } else {
                baseConn = baseConnections.reduce((latest, current) => 
                  (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
                );
              }
            } else {
              const activeConn = baseConnections.find((pc: any) => pc.walletConnecting === true);
              if (activeConn) {
                baseConn = activeConn;
              } else {
                baseConn = baseConnections.reduce((latest, current) => 
                  (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
                );
              }
            }
          }
          
          // Find MetaMask connection from state (to ensure it exists)
          if (metamaskConnections.length > 0) {
            metamaskConn = metamaskConnections.reduce((latest, current) => 
              (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
            );
          }
          
          console.log('[AssetConnect setIsConnectingBase] ✅ Fallback complete - baseConn exists:', !!baseConn, 'metamaskConn exists:', !!metamaskConn);
        }
      }
      
      const tempAddress = '0x0000000000000000000000000000000000000000';
      const now = Date.now();
      
      try {
        // Update or create Base connection
        if (baseConn) {
          const updatedBase = {
            ...baseConn,
            walletConnecting: isConnecting ? (!baseConn.walletConnected) : false,
          };
          console.log('[AssetConnect setIsConnectingBase] 📤 POST /api/savePendingConnection for Base (update)');
          const baseResponse = await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: updatedBase,
          });
          console.log('[AssetConnect] ✅ Backend updated Base - Response status:', baseResponse.status, 'walletConnecting:', updatedBase.walletConnecting);
        } else {
          if (isConnecting) {
            const newBaseConnection = {
              address: tempAddress,
              walletId: `temp-init-base-${now}`,
              walletType: 'base' as const,
              timestamp: now,
              walletConnected: false,
              walletConnecting: isConnecting,
              assetConnected: false,
              assetConnecting: false,
            };
            console.log('[AssetConnect setIsConnectingBase] 📤 POST /api/savePendingConnection for Base (new)');
            const baseResponse = await axios.post('/api/savePendingConnection', {
              email,
              pendingConnection: newBaseConnection,
            });
            console.log('[AssetConnect] ✅ Backend created Base connection - Response status:', baseResponse.status, 'walletConnecting:', isConnecting);
          }
        }
        
        // Ensure MetaMask connection exists (but don't update its walletConnecting boolean)
        if (metamaskConn) {
          // MetaMask connection exists - no need to update it (walletConnecting stays independent)
          console.log('[AssetConnect setIsConnectingBase] ✅ MetaMask connection already exists, no update needed (walletConnecting stays independent)');
        } else {
          // Create MetaMask connection if it doesn't exist
          console.log('[AssetConnect setIsConnectingBase] ➕ Creating MetaMask connection (not found in backend)');
          const newMetaMaskConnection = {
            address: tempAddress,
            walletId: `temp-init-metamask-${now + 1}`,
            walletType: 'metamask' as const,
            timestamp: now + 1,
            walletConnected: false,
            walletConnecting: false, // Keep MetaMask walletConnecting as false (independent)
            assetConnected: false,
            assetConnecting: false,
          };
          console.log('[AssetConnect setIsConnectingBase] 📤 POST /api/savePendingConnection for MetaMask (new) - walletConnecting will be false');
          try {
            const metaMaskResponse = await axios.post('/api/savePendingConnection', {
              email,
              pendingConnection: newMetaMaskConnection,
            });
            console.log('[AssetConnect] ✅ Backend created MetaMask connection - Response status:', metaMaskResponse.status, 'walletConnecting: false (independent)');
          } catch (metaErr: any) {
            console.error('[AssetConnect] ❌ Error creating MetaMask connection:', metaErr?.response?.status || metaErr.message);
            // Don't throw - Base was updated successfully
          }
        }
        
        console.log('[AssetConnect setIsConnectingBase] ✅ Both connections ensured, Base walletConnecting updated');
        if (optimisticUpdateRef.current) {
          optimisticUpdateRef.current.status = 'sent';
          optimisticUpdateRef.current.sentAt = Date.now();
        }
        console.log('[AssetConnect] ✅ Backend updated/created - Base walletConnecting:', isConnecting, 'MetaMask connection ensured (walletConnecting independent)', {
          hadBase: !!baseConn,
          hadMetaMask: !!metamaskConn,
        });
      } catch (apiError: any) {
        console.error('[AssetConnect] ❌ Error updating/creating Base connection:', apiError);
        optimisticUpdateRef.current = null;
        throw apiError;
      }
    })();
    
    try {
      await backendUpdatePromise;
      console.log('[AssetConnect setIsConnectingBase] ✅ Backend update promise completed');
    } catch (error: any) {
      console.error('[AssetConnect setIsConnectingBase] ❌ Backend update promise failed:', error);
      optimisticUpdateRef.current = null;
    }
  }, [email, backendConnections]);
  
  // Update ref when setIsConnectingBase is available
  useEffect(() => {
    setIsConnectingBaseRef.current = setIsConnectingBase;
  }, [setIsConnectingBase]);
  
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
      // Get existing connection to preserve boolean states
      let existingConnection: any = null;
      try {
        const getResponse = await axios.get('/api/savePendingConnection', { params: { email } });
        const existingConnections = getResponse.data.pendingConnections || [];
        existingConnection = existingConnections.find(
          (pc: any) => pc.address?.toLowerCase() === address.toLowerCase() && pc.walletType === walletType
        );
      } catch (e) {
        // Ignore - will create new connection
      }
      
      const response = await axios.post('/api/savePendingConnection', {
        email,
        pendingConnection: {
          address,
          walletId,
          walletType,
          timestamp: Date.now(),
          // Preserve existing boolean states or use defaults
          walletConnected: existingConnection?.walletConnected ?? false,
          walletConnecting: existingConnection?.walletConnecting ?? false,
          assetConnected: existingConnection?.assetConnected ?? false,
          assetConnecting: existingConnection?.assetConnecting ?? false,
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
          assetConnected: verifyConn.assetConnected
        } : 'NOT FOUND');
      } catch (verifyErr) {
        console.error('[AssetConnect savePendingConnectionToBackend] Error verifying save:', verifyErr);
      }
    } catch (error) {
      console.error('[AssetConnect] Error saving pending connection to backend:', error);
    }
  };

  // REMOVED: markPendingConnectionAsCancelled function - no longer needed with simplified 4-boolean system
  // When user cancels, we simply set walletConnecting/assetConnecting to false via setIsConnectingMetaMask/setIsConnectingBase

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
    } catch (error: any) {
      // Silently handle HTTP errors (401, 500, etc.) - API endpoint may not be accessible
      // Don't log to console to avoid spam
      return [];
    }
  };
  
  // NOTE: We do NOT automatically reset walletConnecting states on page load
  // This would cause flickering when connections are legitimately in progress
  // Instead, we rely on:
  // 1. Optimistic updates to pause backend reads during active updates
  // 2. The actual connection process to reset states on cancellation/error
  // 3. User actions to reset states if needed
  // Only reset if we can verify it's truly stale (e.g., very old timestamp, no active process)
  
  // CRITICAL: All states come from backend JSON ONLY - continuously read from backend
  // This is the single source of truth - no local state for pending/connected
  useEffect(() => {
    const syncStateFromBackend = async () => {
      if (!email || typeof window === 'undefined') return;
      
      // CRITICAL: Check optimistic update FIRST (before any backend fetch)
      // Skip backend reads if there's an optimistic update in progress (status: 'pending')
      // Only allow reads once the update is marked as 'sent' (meaning ALL wallet connections are done)
      // This ensures we wait for ALL wallet pending connections and optimistic updates to complete
      if (optimisticUpdateRef.current) {
        if (optimisticUpdateRef.current.status === 'pending') {
          // Update is still in progress - wait for ALL wallet connections (MetaMask AND Base) to complete
          // CRITICAL: Skip ENTIRE function (don't fetch from backend at all)
          const timeSinceOptimistic = Date.now() - optimisticUpdateRef.current.timestamp;
          if (timeSinceOptimistic < 5000) {
            console.log('[AssetConnect syncStateFromBackend] ⏸️ Skipping ENTIRE sync - optimistic update still in progress (pending), waiting for API call to complete. Time since optimistic:', timeSinceOptimistic, 'ms');
            return;
          }
          // More than 5 seconds - API call might be stuck, but still skip to preserve optimistic state
          return;
        } else if (optimisticUpdateRef.current.status === 'sent') {
          // Update is marked as 'sent' - this means BOTH MetaMask AND Base connections are done
          // Allow sync to proceed now that all wallet pending connections are complete
          console.log('[AssetConnect syncStateFromBackend] ✅ Optimistic update marked as "sent" - ALL wallet connections completed, allowing sync');
          // Continue to sync - will mark as 'confirmed' after successful read below
        }
        // If status is 'confirmed', continue normally (no special handling needed)
      }
      
      try {
        const pendingConnections = await fetchPendingConnectionsFromBackend();
        
        // CRITICAL: Compare fetched JSON with last fetched JSON (not current state)
        // Only process/read JSON if it actually changed in the backend
        const currentJsonString = JSON.stringify(pendingConnections);
        if (currentJsonString === lastFetchedJsonRef.current) {
          // JSON hasn't changed since last fetch - don't process it at all
          console.log('[AssetConnect syncStateFromBackend] JSON unchanged, skipping all processing');
          return;
        }
        
        // JSON has changed - update ref and process it
        console.log('[AssetConnect syncStateFromBackend] JSON changed, processing updates');
        lastFetchedJsonRef.current = currentJsonString;
        
        // CRITICAL: Check if we have a recent optimistic update
        // If status is 'pending', COMPLETELY SKIP this polling cycle to eliminate flickering
        const optimistic = optimisticUpdateRef.current;
        const timeSinceOptimistic = optimistic ? Date.now() - optimistic.timestamp : Infinity;
        
        // CRITICAL: If status is 'pending', handle based on time elapsed
        if (optimistic && optimistic.status === 'pending') {
          if (timeSinceOptimistic < 5000) {
            // Still within 5 seconds - skip ALL processing to eliminate flickering
            // The API call hasn't even completed yet, so backend definitely doesn't have the update
            console.log('[AssetConnect syncStateFromBackend] Optimistic update pending (API call in progress), COMPLETELY SKIPPING this polling cycle to eliminate flickering');
            return; // Skip entire polling cycle - don't process anything
          } else {
            // More than 5 seconds elapsed - API call likely failed or is stuck
            // Check if backend has the update, and if not, clear optimistic update
            console.log('[AssetConnect syncStateFromBackend] Optimistic update pending for more than 5 seconds, checking backend state');
            
            const backendConn = pendingConnections.find(
              (pc: any) => pc.walletType === optimistic.walletType
            );
            
            if (backendConn) {
              // Check if backend has the expected value
              let backendValue: boolean | undefined;
              if (optimistic.field === 'walletConnecting') {
                backendValue = backendConn.walletConnecting;
              }
              
              if (backendValue === optimistic.expectedValue) {
                // Backend has the update! API call succeeded but status wasn't updated
                // Clear optimistic and use backend data
                console.log('[AssetConnect syncStateFromBackend] Backend has the update after timeout, clearing optimistic and syncing');
                optimisticUpdateRef.current = null;
                // Continue processing - will use backend data below
              } else {
                // Backend doesn't have the update - API call likely failed
                // Clear optimistic update and let UI reset
                console.log('[AssetConnect syncStateFromBackend] Backend does not have the update after timeout, clearing optimistic update (API call likely failed)');
                optimisticUpdateRef.current = null;
                // Continue processing - will use backend data (which will reset the UI)
              }
            } else {
              // Connection not found in backend - API call likely failed
              // Clear optimistic update and let UI reset
              console.log('[AssetConnect syncStateFromBackend] Connection not found in backend after timeout, clearing optimistic update (API call likely failed)');
              optimisticUpdateRef.current = null;
              // Continue processing - will use backend data (which will reset the UI)
            }
          }
        }
        
        // For 'sent' status, we can check if backend confirms it
        const shouldRespectOptimistic = optimistic && optimistic.status === 'sent' && timeSinceOptimistic < 2000;
        
        // CRITICAL: Compare fetched JSON with current backendConnections to detect changes
        // Only update UI if there are actual changes in boolean values
        // CRITICAL: Double-check optimistic update BEFORE processing any changes
        // This prevents race conditions where optimistic update might be cleared between checks
        const currentOptimistic = optimisticUpdateRef.current;
        if (currentOptimistic && currentOptimistic.status === 'pending') {
          const timeSinceOptimistic = Date.now() - currentOptimistic.timestamp;
          if (timeSinceOptimistic < 5000) {
            return; // Skip entire function - don't call setBackendConnections at all
          }
        }
        
        // Use functional setState to get current state value (avoids stale closure)
        setBackendConnections((currentBackendConnections: any[]) => {
          // CRITICAL: Triple-check optimistic update INSIDE setState to prevent overwrites
          const insideOptimistic = optimisticUpdateRef.current;
          if (insideOptimistic && insideOptimistic.status === 'pending') {
            const timeSinceOptimistic = Date.now() - insideOptimistic.timestamp;
            if (timeSinceOptimistic < 5000) {
              return currentBackendConnections; // Return current state without changes
            }
          }
          
          // Log BEFORE state for comparison
          console.log('[AssetConnect syncStateFromBackend] BEFORE state:', {
            currentConnections: currentBackendConnections.map((pc: any) => ({
              walletType: pc.walletType,
              address: pc.address,
              walletConnected: pc.walletConnected,
              walletConnecting: pc.walletConnecting,
              assetConnected: pc.assetConnected,
              assetConnecting: pc.assetConnecting,
              timestamp: pc.timestamp
            })),
            fetchedConnections: pendingConnections.map((pc: any) => ({
              walletType: pc.walletType,
              address: pc.address,
              walletConnected: pc.walletConnected,
              walletConnecting: pc.walletConnecting,
              assetConnected: pc.assetConnected,
              assetConnecting: pc.assetConnecting,
              timestamp: pc.timestamp
            }))
          });
          
          // Compare fetched data with current state
          const hasChanges = (() => {
            // If lengths are different, there's a change
            if (pendingConnections.length !== currentBackendConnections.length) {
              console.log('[AssetConnect syncStateFromBackend] Length changed:', {
                current: currentBackendConnections.length,
                fetched: pendingConnections.length
              });
              return true;
            }
            
          // CRITICAL: If there's an optimistic update with 'pending' status, ignore changes to that field
          // This prevents overwriting optimistic state with stale backend data
          const optimistic = optimisticUpdateRef.current;
          const shouldIgnoreOptimisticField = optimistic && optimistic.status === 'pending';
          
          // Compare each connection's boolean values
          const changes: any[] = [];
          for (const fetchedPc of pendingConnections) {
            const currentPc = currentBackendConnections.find(
              (pc: any) => 
                pc.walletType === fetchedPc.walletType && 
                pc.address?.toLowerCase() === fetchedPc.address?.toLowerCase()
            );
            
            // If connection doesn't exist in current state, there's a change
            if (!currentPc) {
              changes.push({
                type: 'new_connection',
                walletType: fetchedPc.walletType,
                address: fetchedPc.address
              });
              return true;
            }
            
            // Compare all boolean fields - if any differ, there's a change
            // CRITICAL: Ignore changes to the optimistic field if status is 'pending'
            const fieldChanges: any = {};
            if (currentPc.walletConnected !== fetchedPc.walletConnected) {
              fieldChanges.walletConnected = { from: currentPc.walletConnected, to: fetchedPc.walletConnected };
            }
            if (currentPc.walletConnecting !== fetchedPc.walletConnecting) {
              // CRITICAL: Ignore this change if it's the optimistic field and status is 'pending'
              if (!(shouldIgnoreOptimisticField && optimistic?.walletType === fetchedPc.walletType && optimistic?.field === 'walletConnecting')) {
                fieldChanges.walletConnecting = { from: currentPc.walletConnecting, to: fetchedPc.walletConnecting };
              }
            }
            if (currentPc.assetConnected !== fetchedPc.assetConnected) {
              fieldChanges.assetConnected = { from: currentPc.assetConnected, to: fetchedPc.assetConnected };
            }
            if (currentPc.assetConnecting !== fetchedPc.assetConnecting) {
              // CRITICAL: Ignore this change if it's the optimistic field and status is 'pending'
              if (!(shouldIgnoreOptimisticField && optimistic?.walletType === fetchedPc.walletType && optimistic?.field === 'assetConnecting')) {
                fieldChanges.assetConnecting = { from: currentPc.assetConnecting, to: fetchedPc.assetConnecting };
              }
            }
              
              if (Object.keys(fieldChanges).length > 0) {
                changes.push({
                  type: 'field_changes',
                  walletType: fetchedPc.walletType,
                  address: fetchedPc.address,
                  changes: fieldChanges
                });
                return true;
              }
            }
            
            // Check if any current connections are missing from fetched (deleted)
            for (const currentPc of currentBackendConnections) {
              const fetchedPc = pendingConnections.find(
                (pc: any) => 
                  pc.walletType === currentPc.walletType && 
                  pc.address?.toLowerCase() === currentPc.address?.toLowerCase()
              );
              if (!fetchedPc) {
                changes.push({
                  type: 'deleted_connection',
                  walletType: currentPc.walletType,
                  address: currentPc.address
                });
                return true;
              }
            }
            
            if (changes.length > 0) {
              console.log('[AssetConnect syncStateFromBackend] Changes detected:', changes);
            }
            
            return false; // No changes detected
          })();
          
          // If no changes detected, return current state (no update, prevents unnecessary re-renders)
          if (!hasChanges) {
            console.log('[AssetConnect syncStateFromBackend] No changes detected in JSON, skipping UI update');
            return currentBackendConnections; // Return current state, no update
          }
          
          console.log('[AssetConnect syncStateFromBackend] Changes detected in JSON, applying to UI');
          
          // If we have a recent optimistic update with 'sent' status, check if backend confirms it
          // CRITICAL: 'pending' status is already handled above - we skip the entire polling cycle
          // Only process 'sent' status here to check if backend has confirmed the optimistic update
          if (shouldRespectOptimistic && optimistic && optimistic.status === 'sent' && optimistic.sentAt) {
            const backendConn = pendingConnections.find(
              (pc: any) => pc.walletType === optimistic.walletType
            );
            
            if (backendConn) {
              // API succeeded, but S3 might not be ready yet
              const timeSinceSent = Date.now() - optimistic.sentAt;
              
              if (backendConn) {
                let backendValue: boolean | undefined;
                
                if (optimistic.field === 'walletConnecting') {
                  backendValue = backendConn.walletConnecting;
                }
                
                // Backend confirms if the value matches what we optimistically set
                if (backendValue === optimistic.expectedValue) {
                  // Backend confirmed! Clear optimistic flag and use backend data (fully synced)
                  console.log('[AssetConnect syncStateFromBackend] Backend confirmed optimistic update, clearing flag and syncing');
                  optimisticUpdateRef.current = null;
                  // CRITICAL: Merge backend data with current state to preserve connections from other wallet types
                  // that might not be in backend yet (e.g., Base connection when MetaMask is being updated)
                  const merged = pendingConnections.map((backendPc: any) => backendPc);
                  // Add any connections from current state that aren't in backend (for other wallet types)
                  currentBackendConnections.forEach((currentPc: any) => {
                    if (currentPc.walletType !== optimistic.walletType) {
                      const existsInBackend = pendingConnections.some(
                        (pc: any) => pc.walletType === currentPc.walletType
                      );
                      if (!existsInBackend) {
                        merged.push(currentPc);
                      }
                    }
                  });
                  return merged;
                } else {
                  // Backend hasn't confirmed yet - merge but preserve optimistic field
                  if (timeSinceSent < 1000) {
                    // Still within reasonable time (1 second) - merge backend but preserve optimistic field
                    console.log('[AssetConnect syncStateFromBackend] Backend hasn\'t confirmed yet (sent', timeSinceSent, 'ms ago), merging backend updates but preserving optimistic field');
                    
                    // Merge: Use backend data but preserve the optimistic field from current state
                    const merged = pendingConnections.map((backendPc: any) => {
                      if (backendPc.walletType === optimistic.walletType) {
                        const optimisticPc = currentBackendConnections.find(
                          (pc: any) => pc.walletType === optimistic.walletType
                        );
                        if (optimisticPc) {
                          return {
                            ...backendPc,
                            [optimistic.field]: optimisticPc[optimistic.field], // Preserve optimistic field
                          };
                        }
                      }
                      return backendPc; // Use backend data for all other connections and fields
                    });
                    return merged;
                  } else {
                    // Too long - something went wrong, use backend data
                    console.log('[AssetConnect syncStateFromBackend] Backend hasn\'t confirmed after 1 second, using backend data');
                    optimisticUpdateRef.current = null;
                    // CRITICAL: Merge backend data with current state to preserve connections from other wallet types
                    const merged = pendingConnections.map((backendPc: any) => backendPc);
                    currentBackendConnections.forEach((currentPc: any) => {
                      if (currentPc.walletType !== optimistic.walletType) {
                        const existsInBackend = pendingConnections.some(
                          (pc: any) => pc.walletType === currentPc.walletType
                        );
                        if (!existsInBackend) {
                          merged.push(currentPc);
                        }
                      }
                    });
                    return merged;
                  }
                }
              } else {
                // Connection not found in backend yet
                if (timeSinceSent < 1000) {
                  // Still within reasonable time - keep optimistic state but merge other connections
                  console.log('[AssetConnect syncStateFromBackend] Connection not found in backend yet (sent', timeSinceSent, 'ms ago), preserving optimistic state but merging other connections');
                  
                  // Merge: Keep optimistic connection, but add any new connections from backend
                  const optimisticPc = currentBackendConnections.find(
                    (pc: any) => pc.walletType === optimistic.walletType
                  );
                  if (optimisticPc) {
                    // Keep optimistic connection, add other backend connections
                    const otherBackendConnections = pendingConnections.filter(
                      (pc: any) => pc.walletType !== optimistic.walletType
                    );
                    return [optimisticPc, ...otherBackendConnections];
                  }
                  // Optimistic connection not found in current state - merge all backend connections
                  // This ensures we don't lose connections from other wallet types
                  console.log('[AssetConnect syncStateFromBackend] Optimistic connection not found in current state, merging backend with current state');
                  // CRITICAL: Merge backend data with current state to preserve connections from other wallet types
                  const merged = pendingConnections.map((backendPc: any) => backendPc);
                  currentBackendConnections.forEach((currentPc: any) => {
                    if (currentPc.walletType !== optimistic.walletType) {
                      const existsInBackend = pendingConnections.some(
                        (pc: any) => pc.walletType === currentPc.walletType
                      );
                      if (!existsInBackend) {
                        merged.push(currentPc);
                      }
                    }
                  });
                  return merged;
                } else {
                  // Too long - something went wrong
                  console.log('[AssetConnect syncStateFromBackend] Connection not found after 1 second, clearing optimistic flag');
                  optimisticUpdateRef.current = null;
                  // CRITICAL: Merge backend data with current state to preserve connections from other wallet types
                  const merged = pendingConnections.map((backendPc: any) => backendPc);
                  currentBackendConnections.forEach((currentPc: any) => {
                    const existsInBackend = pendingConnections.some(
                      (pc: any) => pc.walletType === currentPc.walletType
                    );
                    if (!existsInBackend) {
                      merged.push(currentPc);
                    }
                  });
                  return merged;
                }
              }
            }
          }
          
          // CRITICAL: If optimistic update is still 'pending', preserve the optimistic field
          // Don't overwrite it with backend data until the API call completes
          if (optimistic && optimistic.status === 'pending' && timeSinceOptimistic < 5000) {
            console.log('[AssetConnect syncStateFromBackend] Optimistic update still pending, preserving optimistic field:', optimistic.field);
            // Merge backend data but preserve the optimistic field from current state
            const merged = pendingConnections.map((backendPc: any) => {
              if (backendPc.walletType === optimistic.walletType) {
                const optimisticPc = currentBackendConnections.find(
                  (pc: any) => pc.walletType === optimistic.walletType
                );
                if (optimisticPc) {
                  return {
                    ...backendPc,
                    [optimistic.field]: optimisticPc[optimistic.field], // Preserve optimistic field
                  };
                }
              }
              return backendPc;
            });
            // Add any connections from current state that aren't in backend
            currentBackendConnections.forEach((currentPc: any) => {
              const existsInBackend = pendingConnections.some(
                (pc: any) => pc.walletType === currentPc.walletType
              );
              if (!existsInBackend) {
                merged.push(currentPc);
              }
            });
            return merged;
          }
          
          // No optimistic update or it's been more than 5 seconds - safe to update from backend
          // This is a safety timeout in case backend never confirms
          if (optimistic && timeSinceOptimistic >= 5000) {
            console.log('[AssetConnect syncStateFromBackend] Optimistic update expired (5 seconds), clearing flag and using backend');
            optimisticUpdateRef.current = null;
            // Now safe to use backend data
          }
          
          // CRITICAL: Always merge backend data with current state to preserve connections from other wallet types
          // that might not be in backend yet (e.g., when one wallet type is being updated)
          const merged = pendingConnections.map((backendPc: any) => backendPc);
          currentBackendConnections.forEach((currentPc: any) => {
            const existsInBackend = pendingConnections.some(
              (pc: any) => pc.walletType === currentPc.walletType
            );
            if (!existsInBackend) {
              merged.push(currentPc);
            }
          });
          
          // Log AFTER state for comparison
          console.log('[AssetConnect syncStateFromBackend] AFTER state (merged):', {
            mergedConnections: merged.map((pc: any) => ({
              walletType: pc.walletType,
              address: pc.address,
              walletConnected: pc.walletConnected,
              walletConnecting: pc.walletConnecting,
              assetConnected: pc.assetConnected,
              assetConnecting: pc.assetConnecting,
              timestamp: pc.timestamp
            }))
          });
          
          return merged;
        });
        
        
        // Update localStorage to match backend state (for wallet extension checks)
        const completedMetaMask = pendingConnections.find(
          (pc: any) => pc.walletType === 'metamask' && pc.assetConnected
        );
        const completedBase = pendingConnections.find(
          (pc: any) => pc.walletType === 'base' && pc.assetConnected
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
  
    // CRITICAL: Run immediately on mount to initialize from backend
    // If page reloaded before backend saved optimistic update, buttons will reset correctly
    // because backendConnections will only contain what backend actually has
    syncStateFromBackend();
    
    // Run periodically to catch updates (every 100ms for faster responsiveness)
    const intervalId = setInterval(syncStateFromBackend, 100);
    
    return () => clearInterval(intervalId);
  }, [email]);
  
  // Use refs to prevent multiple executions (persist across re-renders but reset on mount)
  const hasProcessedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastProcessedAddressRef = useRef<string | null>(null);
  const lastCancelledAddressRef = useRef<string | null>(null);
  const lastCancelledTypeRef = useRef<WalletType | null>(null);
  const lastCancelledTimestampRef = useRef<number>(0);
  const hasCheckedOnMountRef = useRef(false); // Track if we've checked on initial mount
  // Mount reset removed - walletConnecting and assetConnecting booleans removed from JSON
  
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
        // Simplified: Check if any connections are not connecting and not connected (effectively cancelled)
        const hasCancelledConnections = backendPendingConnections.some(
          (pc: any) => !pc.assetConnecting && !pc.assetConnected
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
          if (matchingConnection.assetConnected) {
            completedConnectionForThisWallet = matchingConnection;
            console.log('[AssetConnect] Found completed deposit in JSON for', pendingTypeFromStorage, 'wallet:', matchingConnection.address);
          } else if (!matchingConnection.assetConnected) {
            // Still pending
            pendingConnection = matchingConnection;
          }
        }
        
        // Fallback: Get the most recent pending connection that hasn't been cancelled (if no match found)
        // ONLY if we have a pending address from state - don't pick up random connections
        if (!pendingConnection && !completedConnectionForThisWallet && pendingAddressFromStorage) {
          const activeConnections = backendPendingConnections.filter(
            (pc: any) => 
              !pc.assetConnected &&
              pc.address?.toLowerCase() === pendingAddressFromStorage.toLowerCase() &&
              pc.walletType === pendingTypeFromStorage
          );
          if (activeConnections.length > 0) {
            activeConnections.sort((a: any, b: any) => b.timestamp - a.timestamp);
            pendingConnection = activeConnections[0];
          }
        }
      } catch (error: any) {
        // Silently handle HTTP errors (401, 500, etc.) - API endpoint may not be accessible
        // Don't log to console to avoid spam
      }
      
      // If we have a completed connection for this wallet type, use that (deposit was done, just need to create wallet)
      if (completedConnectionForThisWallet && !pendingConnection) {
        pendingConnection = completedConnectionForThisWallet;
      }
      
      // Get pending info from backend JSON ONLY (no sessionStorage fallback)
      const pendingAddress = pendingConnection?.address;
      const pendingType = pendingConnection?.walletType as WalletType | undefined;
      const pendingWalletId = pendingConnection?.walletId;
      const depositCompleted = pendingConnection?.assetConnected || false;
      const depositConfirmed = pendingConnection?.assetConnected || false;
      
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
          // Simplified: Just set assetConnecting to false when cancelled
          if (thisConnection && thisConnection.assetConnecting) {
            // Update connection to set assetConnecting: false
            try {
              await axios.post('/api/savePendingConnection', {
                email,
                pendingConnection: {
                  ...thisConnection,
                  assetConnecting: false,
                },
              });
            } catch (err) {
              console.error('[AssetConnect] Error updating assetConnecting to false:', err);
            }
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
      // Simplified: Check if deposit is not connecting and not connected (effectively cancelled)
      const depositCancelled = pendingConnection && !pendingConnection.assetConnecting && !pendingConnection.assetConnected;
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
                      // Deposit completed
                      assetConnected: true,
                      assetConnecting: false,
                      // Wallet was connected before deposit
                      walletConnected: true,
                      walletConnecting: false,
                      txHash: depositTxHash,
                    },
                  });
                  console.log('[AssetConnect] Marked deposit as completed in backend - keeping connection in JSON');
                } catch (error) {
                  console.error('[AssetConnect] Error updating pending connection in backend:', error);
                }
              }
              
              // CRITICAL: DO NOT remove completed connections - keep them in JSON with assetConnected: true
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
        // Simplified: Check if connection is not connecting and not connected (effectively cancelled)
        if (thisConnection && !thisConnection.assetConnecting && !thisConnection.assetConnected) {
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
        let depositCompletedInJSONForThisWallet = connectionToCheck?.assetConnected === true && 
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
                    assetConnected: true,
                    assetConnecting: false,
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
                    assetConnected: true,
                    assetConnecting: false,
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
                      // Deposit completed
                      assetConnected: true,
                      assetConnecting: false,
                      // Wallet was connected before deposit
                      walletConnected: true,
                      walletConnecting: false,
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
        if (!depositCompleted) { // depositCompleted is local variable from assetConnected
          
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
                // Deposit completed
                assetConnected: true,
                assetConnecting: false,
                // Wallet was connected before deposit
                walletConnected: true,
                walletConnecting: false,
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
                // Deposit completed
                assetConnected: true,
                assetConnecting: false,
                // Wallet was connected before deposit
                walletConnected: true,
                walletConnecting: false,
                txHash: txHash || 'unknown',
              },
              });
            } catch (error) {
              console.error('[AssetConnect] Error updating pending connection in backend:', error);
            }
            
            // CRITICAL: DO NOT remove completed connections - keep them in JSON with assetConnected: true
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
              
              // Simplified: Just set assetConnecting to false when cancelled
              // Find and update the connection
              try {
                const response = await axios.get('/api/savePendingConnection', { params: { email } });
                const connections = response.data.pendingConnections || [];
                const connToUpdate = connections.find((pc: any) => 
                  pc.walletType === pendingType && 
                  (pendingAddress ? pc.address?.toLowerCase() === pendingAddress.toLowerCase() : pc.assetConnecting === true)
                );
                if (connToUpdate && connToUpdate.assetConnecting) {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      ...connToUpdate,
                      assetConnecting: false,
                    },
                  });
                }
              } catch (err) {
                console.error('[processPendingWallet] Error updating assetConnecting to false:', err);
              }
              
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
            (pc: any) => pc.walletType === 'metamask' && pc.assetConnected
          );
          const completedBase = backendConnections.find(
            (pc: any) => pc.walletType === 'base' && pc.assetConnected
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
              (pc: any) => pc.walletType === 'metamask' && !pc.assetConnected
            );
            
            // If there's a pending MetaMask connection but extension is not connected, only update walletConnected status
            // CRITICAL: NEVER automatically cancel connection attempts - only user can cancel
            // Only update walletConnected: false if wallet was previously connected but is now disconnected
            if (pendingMetaMaskConn && !metaMaskExtensionConnected && !metaMaskInWallets) {
              // Only update if wallet was connected (not connecting) - don't touch walletConnecting state
              if (pendingMetaMaskConn.walletConnected && !pendingMetaMaskConn.walletConnecting) {
                console.log('[AssetConnect] MetaMask disconnected - updating walletConnected to false in backend');
                if (lastConnectedMetaMask) {
                  localStorage.removeItem('lastConnectedMetaMask');
                }
                try {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      ...pendingMetaMaskConn,
                      walletConnected: false,
                    },
                  });
                } catch (err) {
                  console.error('[AssetConnect] Error updating wallet disconnected state:', err);
                }
              }
              // If walletConnecting is true, do nothing - let user cancel explicitly or let it timeout naturally
            }
            
            // Check for Base pending connections
            const pendingBaseConn = backendPendingConnections.find(
              (pc: any) => pc.walletType === 'base' && !pc.assetConnected
            );
            
            // If there's a pending Base connection but extension is not connected, only update walletConnected status
            // CRITICAL: NEVER automatically cancel connection attempts - only user can cancel
            // Only update walletConnected: false if wallet was previously connected but is now disconnected
            if (pendingBaseConn && !baseExtensionConnected && !baseInWallets) {
              // Only update if wallet was connected (not connecting) - don't touch walletConnecting state
              if (pendingBaseConn.walletConnected && !pendingBaseConn.walletConnecting) {
                console.log('[AssetConnect] Base disconnected - updating walletConnected to false in backend');
                if (lastConnectedBase) {
                  localStorage.removeItem('lastConnectedBase');
                }
                try {
                  await axios.post('/api/savePendingConnection', {
                    email,
                    pendingConnection: {
                      ...pendingBaseConn,
                      walletConnected: false,
                    },
                  });
                } catch (err) {
                  console.error('[AssetConnect] Error updating wallet disconnected state:', err);
                }
              }
              // If walletConnecting is true, do nothing - let user cancel explicitly or let it timeout naturally
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
          (pc: any) => !pc.assetConnected
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
              // Deposit completed
              assetConnected: true,
              assetConnecting: false,
              // Wallet was connected before deposit
              walletConnected: true,
              walletConnecting: false,
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
        
        // Simplified: Just set assetConnecting to false when cancelled
        if (email) {
          try {
            const response = await axios.get('/api/savePendingConnection', { params: { email } });
            const connections = response.data.pendingConnections || [];
            const connToUpdate = connections.find((pc: any) => 
              pc.walletType === walletType && pc.assetConnecting === true
            );
            if (connToUpdate) {
              await axios.post('/api/savePendingConnection', {
                email,
                pendingConnection: {
                  ...connToUpdate,
                  assetConnecting: false,
                },
              });
            }
          } catch (err) {
            console.error('[connectAssetForWallet] Error updating assetConnecting to false:', err);
          }
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
      console.log('[connectAsset] 🚀🚀🚀 FUNCTION CALLED with walletType:', walletType, 'email:', email);
      console.log('[connectAsset] 🚀 Timestamp:', Date.now());
      console.log('[connectAsset] 🚀 Stack trace:', new Error().stack?.split('\n').slice(0, 5).join('\n'));
    
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
    // Connecting state removed - no longer tracking

    // Declare shouldExit before try block so it's accessible after catch
    let shouldExit = false;
    try {
      if (!email) {
        throw new Error('Please sign in first to connect a wallet.');
      }
      
      // Step 1: Connect to wallet
      let accounts: string[] = [];
      try {
        console.log('[connectAsset] 🚀 About to await connectWalletUtil - if error is thrown, it should be caught below');
        const result = await connectWalletUtil(walletType);
        console.log('[connectAsset] ✅ connectWalletUtil succeeded, got accounts:', result.accounts);
        accounts = result.accounts;
      } catch (walletError: any) {
        console.error('[connectAsset] ⚠️⚠️⚠️ CATCH BLOCK EXECUTED! ⚠️⚠️⚠️');
        console.error('[connectAsset] ⚠️ This means the error WAS thrown and IS being caught');
        // CRITICAL: This catch block MUST catch cancellations after page reload
        console.error('[connectAsset] ⚠️⚠️⚠️ CATCH BLOCK REACHED! ⚠️⚠️⚠️');
        console.error('[connectAsset] ⚠️ This means the error WAS thrown and IS being caught');
        console.error('[connectAsset] ⚠️ WALLET ERROR CAUGHT - Full error object:', walletError);
        console.error('[connectAsset] ⚠️ Error type:', typeof walletError);
        console.error('[connectAsset] ⚠️ Error constructor:', walletError?.constructor?.name);
        console.error('[connectAsset] ⚠️ Error keys:', Object.keys(walletError || {}));
        
        // If user cancels wallet connection, just clear local state - DO NOT mark as cancelled in backend
        // The user can explicitly cancel later if needed, but we shouldn't automatically cancel
        // CRITICAL: Only treat as cancellation if it's a confirmed user rejection
        // Error code 4001 is the standard EIP-1193 user rejection code
        const errorMsg = String(walletError?.message || walletError?.toString() || '');
        const nestedErrorMsg = String(walletError?.error?.message || walletError?.error?.toString() || '');
        const errorCode = walletError?.code || walletError?.error?.code;
        
        console.error('[connectAsset] ⚠️ Error message extraction:', {
          errorMsg,
          nestedErrorMsg,
          errorCode,
          walletError,
          walletErrorError: walletError?.error,
          walletErrorString: String(walletError),
          walletErrorJSON: JSON.stringify(walletError, null, 2)
        });
        
        // Only treat as cancellation if it's a confirmed user rejection
        // This prevents treating other errors (like network errors, missing extension, etc.) as cancellations
        // Make cancellation detection more robust to catch all wallet rejection formats
        const isCancelled = 
          errorCode === 4001 || // Standard EIP-1193 user rejection
          errorCode === 'ACTION_REJECTED' || // Some wallets use this
          errorCode === 4900 || // Some wallets use this for user rejection
          errorMsg.toLowerCase().includes('user rejected') ||
          errorMsg.toLowerCase().includes('user cancelled') ||
          errorMsg.toLowerCase().includes('user denied') ||
          errorMsg.toLowerCase().includes('rejected') ||
          errorMsg.toLowerCase().includes('cancelled') ||
          errorMsg.toLowerCase().includes('denied') ||
          (walletError?.isCancelled === true) ||
          (walletError?.error?.code === 4001) ||
          (walletError?.error?.code === 'ACTION_REJECTED');
        
        console.log('[connectAsset] Wallet connection error:', {
          walletType,
          errorMsg,
          errorCode: errorCode,
          isCancelled,
          fullError: walletError,
          note: isCancelled ? 'User cancelled - clearing local state only' : 'Other error - re-throwing'
        });
        
        if (isCancelled) {
          console.log('[connectAsset] User cancelled wallet connection - resetting walletConnecting to false');
          
          // Reset pending state
          if (walletType === 'metamask') {
            setPendingMetaMask(null);
          } else {
            setPendingBase(null);
          }
          
          console.log('[connectAsset] Cancellation complete - state reset, throwing error to notify caller');
          // Throw error so VavityTester's catch block can handle it
          throw new Error('User rejected');
        }
        
        // Not a cancellation - log and re-throw
        console.log('[connectAsset] Wallet connection failed (not a cancellation), re-throwing error');
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
          
          // NO optimistic updates - frontend fetcher will detect JSON changes and update buttons
          // The polling useEffect will pick up the changes automatically
        } catch (error) {
          console.error('[connectAsset] Failed to save pending connection to backend:', error);
          // Don't throw - continue with deposit flow even if save fails
          // But log it clearly so we can debug
        }
      } else {
        console.warn('[connectAsset] window is undefined, cannot save pending connection');
      }
      
      // Connecting state removed - no longer tracking
      
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
              // Deposit completed
              assetConnected: true,
              assetConnecting: false,
              // Wallet was connected before deposit
              walletConnected: true,
              walletConnecting: false,
              txHash: txHash || 'unknown',
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
          // Reset pending state immediately
          if (walletType === 'metamask') {
            setPendingMetaMask(null);
          } else {
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
                (pc: any) => pc.walletType === walletType && !pc.assetConnected
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
          
          // Simplified: Just set assetConnecting to false when cancelled
          if (addressToCancel && email) {
            try {
              const response = await axios.get('/api/savePendingConnection', { params: { email } });
              const connections = response.data.pendingConnections || [];
              const connToUpdate = connections.find((pc: any) => 
                pc.walletType === walletType && 
                pc.address?.toLowerCase() === addressToCancel.toLowerCase() &&
                pc.assetConnecting === true
              );
              if (connToUpdate) {
                await axios.post('/api/savePendingConnection', {
                  email,
                  pendingConnection: {
                    ...connToUpdate,
                    assetConnecting: false,
                  },
                });
              }
            } catch (err) {
              console.error('[connectAsset] Error updating assetConnecting to false:', err);
            }
          }
          
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
      
      // Connecting state removed - no longer tracking
      
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
              (pc: any) => pc.walletType === walletType && !pc.assetConnected
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
          
          // Simplified: Just set assetConnecting to false when cancelled
          if (walletAddressFromError && email) {
            try {
              const response = await axios.get('/api/savePendingConnection', { params: { email } });
              const connections = response.data.pendingConnections || [];
              const connToUpdate = connections.find((pc: any) => 
                pc.walletType === walletType && 
                pc.address?.toLowerCase() === walletAddressFromError.toLowerCase() &&
                pc.assetConnecting === true
              );
              if (connToUpdate) {
                await axios.post('/api/savePendingConnection', {
                  email,
                  pendingConnection: {
                    ...connToUpdate,
                    assetConnecting: false,
                  },
                });
              }
            } catch (err) {
              console.error('[connectAsset] Error updating assetConnecting to false:', err);
            }
          }
          
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
      
      // CRITICAL: Check if this is a cancellation by checking the error message
      // isCancelled is a local variable in the inner try-catch, so we need to check the error message here
      const cancellationErrorMsg = String(error?.message || error?.toString() || '');
      const isCancellation = 
        cancellationErrorMsg === 'User rejected' ||
        cancellationErrorMsg.toLowerCase().includes('user rejected') ||
        cancellationErrorMsg.toLowerCase().includes('user cancelled') ||
        cancellationErrorMsg.toLowerCase().includes('user denied') ||
        cancellationErrorMsg.toLowerCase().includes('rejected') ||
        error?.code === 4001 ||
        error?.code === 'ACTION_REJECTED';
      
      // Only throw error if it's not a cancellation (so outer handlers can show alert for real errors)
      if (!isCancellation) {
        throw error;
      }
      
      // CRITICAL: Don't reload on cancellation - user explicitly rejected the connection
      console.log('[connectAsset] User cancelled - NOT reloading page');
      return; // Exit early on cancellation, don't reload
      
      // Even on error (but not cancellation), if we got the wallet address, try to reload
      // (This code is unreachable if cancellation, but kept for non-cancellation errors)
      const walletAddressFromError = error?.walletAddress || (typeof window !== 'undefined' && localStorage.getItem(walletType === 'metamask' ? 'lastConnectedMetaMask' : 'lastConnectedBase'));
      if (walletAddressFromError) {
        console.log('Error occurred but wallet was connected, reloading anyway...');
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
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
        metaMaskWalletConnected,
        metaMaskAssetConnected,
        baseWalletConnected,
        baseAssetConnected,
        connectAsset,
        connectAssetForWallet,
        clearAutoConnectedMetaMask,
        clearAutoConnectedBase,
        setPendingMetaMask,
        setPendingBase,
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

