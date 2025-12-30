'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAssetConnect } from '../../context/AssetConnectContext';
import { useVavity } from '../../context/VavityAggregator';
import axios from 'axios';

const VavityTester: React.FC = () => {
  const { email } = useVavity();
  const {
    metaMaskWalletConnected,
    metaMaskAssetConnected,
    baseWalletConnected,
    baseAssetConnected,
    connectAsset,
  } = useAssetConnect();

  const [connectionState, setConnectionState] = useState<any>(null);

  // Check pending connections - use useCallback to memoize
  const checkPending = useCallback(async () => {
    if (!email) {
      console.log('[VavityTester checkPending] No email available, skipping');
      return;
    }
    
    try {
      console.log('[VavityTester checkPending] Fetching connections for email:', email);
      const response = await axios.get('/api/savePendingConnection', { params: { email } });
      const connections = response.data.pendingConnections || [];
      
      const metamaskConn = connections.find((pc: any) => pc.walletType === 'metamask') || {
        address: '0x0000000000000000000000000000000000000000',
        walletConnected: false,
        assetConnected: false,
      };
      
      const baseConn = connections.find((pc: any) => pc.walletType === 'base') || {
        address: '0x0000000000000000000000000000000000000000',
        walletConnected: false,
        assetConnected: false,
      };
      
      const state = {
        totalConnections: connections.length,
        metamaskConn,
        baseConn,
      };
      
      setConnectionState(state);
      console.log('[VavityTester checkPending] Connection state:', state);
    } catch (error: any) {
      // Silently handle HTTP errors - don't log to console to avoid spam
      if (error?.response?.status !== 401 && error?.response?.status !== 500) {
        console.error('[VavityTester checkPending] Error:', error);
      }
    }
  }, [email]);

  useEffect(() => {
    console.log('[VavityTester] Component mounted, email:', email);
    checkPending();
    const interval = setInterval(checkPending, 2000);
    return () => {
      console.log('[VavityTester] Component unmounting, clearing interval');
      clearInterval(interval);
    };
  }, [checkPending, email]);

  const handleConnectAsset = async (walletType: 'metamask' | 'base') => {
    if (!email) {
      console.error('[VavityTester] No email available');
      return;
    }

    console.log('[VavityTester handleConnectAsset] Starting connection for:', walletType);

    try {
      // Create/ensure both MetaMask and Base connections exist in JSON before connecting
      console.log('[VavityTester handleConnectAsset] Creating/updating both connections in JSON...');
      
      const tempAddress = '0x0000000000000000000000000000000000000000';
      const now = Date.now();
      
      // First, try to get existing connections
      let existingConnections: any[] = [];
      try {
        const getResponse = await axios.get('/api/savePendingConnection', { params: { email } });
        existingConnections = getResponse.data.pendingConnections || [];
        console.log('[VavityTester handleConnectAsset] ✅ GET succeeded, found', existingConnections.length, 'existing connections');
      } catch (getError: any) {
        // If GET fails, treat as no connections exist
        console.log('[VavityTester handleConnectAsset] ⚠️ GET failed (will create new connections):', getError?.response?.status || getError?.message);
      }
      
      const metamaskConn = existingConnections.find((pc: any) => pc.walletType === 'metamask');
      const baseConn = existingConnections.find((pc: any) => pc.walletType === 'base');
      
      // Create/update MetaMask connection
      if (!metamaskConn) {
        console.log('[VavityTester handleConnectAsset] ➕ Creating MetaMask connection');
        try {
          const metaMaskResponse = await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: {
              address: tempAddress,
              walletId: `temp-init-metamask-${now}`,
              walletType: 'metamask',
              timestamp: now,
              walletConnected: false,
              assetConnected: false,
            },
          });
          console.log('[VavityTester handleConnectAsset] ✅ MetaMask connection created, status:', metaMaskResponse.status);
        } catch (metaMaskError: any) {
          console.error('[VavityTester handleConnectAsset] ❌ Failed to create MetaMask connection:', metaMaskError?.response?.status || metaMaskError?.message);
          throw metaMaskError; // Re-throw to be caught by outer catch
        }
      } else {
        console.log('[VavityTester handleConnectAsset] ✅ MetaMask connection already exists');
      }
      
      // Create/update Base connection
      if (!baseConn) {
        console.log('[VavityTester handleConnectAsset] ➕ Creating Base connection');
        try {
          const baseResponse = await axios.post('/api/savePendingConnection', {
            email,
            pendingConnection: {
              address: tempAddress,
              walletId: `temp-init-base-${now + 1}`,
              walletType: 'base',
              timestamp: now + 1,
              walletConnected: false,
              assetConnected: false,
            },
          });
          console.log('[VavityTester handleConnectAsset] ✅ Base connection created, status:', baseResponse.status);
        } catch (baseError: any) {
          console.error('[VavityTester handleConnectAsset] ❌ Failed to create Base connection:', baseError?.response?.status || baseError?.message);
          throw baseError; // Re-throw to be caught by outer catch
        }
      } else {
        console.log('[VavityTester handleConnectAsset] ✅ Base connection already exists');
      }
      
      console.log('[VavityTester handleConnectAsset] ✅ Both connections ensured in JSON');
      
      // Proceed with actual wallet connection
      console.log('[VavityTester handleConnectAsset] Starting wallet connection');
      await connectAsset(walletType);
    } catch (error: any) {
      console.log('[VavityTester handleConnectAsset] Error caught:', error.message, error);
      
      // Check if it's a user rejection/cancellation
      const isUserRejection = error.message === 'User rejected' || 
                              error.message?.includes('User rejected') ||
                              error.message?.includes('rejected') ||
                              error.code === 4001;
      
      console.log('[VavityTester handleConnectAsset] Is user rejection?', isUserRejection);
      
      // Connecting state removed - no longer tracking walletConnecting/assetConnecting
      
      // Silently handle HTTP errors (401, 500, etc.) - API endpoint may not be accessible
      // Only show alerts for unexpected errors, not for "User rejected" or HTTP errors
      if (!isUserRejection && !error?.response) {
        alert(`Error connecting ${walletType}: ${error.message}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px', color: '#ffffff' }}>
      <h1 style={{ color: '#ffffff', marginBottom: '20px' }}>Vavity Tester</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          Email: {email || 'Not available'}
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>MetaMask</h2>
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => handleConnectAsset('metamask')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            CONNECT ETHEREUM
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          <div>Wallet Connected: {metaMaskWalletConnected ? 'Yes' : 'No'}</div>
          <div>Asset Connected: {metaMaskAssetConnected ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Base</h2>
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => handleConnectAsset('base')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            CONNECT ETHEREUM
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          <div>Wallet Connected: {baseWalletConnected ? 'Yes' : 'No'}</div>
          <div>Asset Connected: {baseAssetConnected ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      {connectionState && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>Connection State (from Backend)</h3>
          <pre style={{ color: '#ffffff', fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(connectionState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default VavityTester;
