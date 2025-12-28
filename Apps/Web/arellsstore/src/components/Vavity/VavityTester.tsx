'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAssetConnect } from '../../context/AssetConnectContext';
import { useVavity } from '../../context/VavityAggregator';
import axios from 'axios';

const VavityTester: React.FC = () => {
  const { email } = useVavity();
  const {
    metaMaskWalletConnected,
    metaMaskWalletConnecting,
    metaMaskAssetConnected,
    metaMaskAssetConnecting,
    baseWalletConnected,
    baseWalletConnecting,
    baseAssetConnected,
    baseAssetConnecting,
    connectAsset,
    setIsConnectingMetaMask,
    setIsConnectingBase,
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
        walletConnecting: false,
        assetConnected: false,
        assetConnecting: false,
      };
      
      const baseConn = connections.find((pc: any) => pc.walletType === 'base') || {
        address: '0x0000000000000000000000000000000000000000',
        walletConnected: false,
        walletConnecting: false,
        assetConnected: false,
        assetConnecting: false,
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
      // Don't create connections here - let setIsConnectingMetaMask handle it
      // This avoids race conditions from parallel API calls
      console.log('[VavityTester handleConnectAsset] About to call setIsConnectingMetaMask(true) to create/update both connections');
      
      // Set connecting state for both (this updates local state and backend JSON)
      // This will create/update both MetaMask and Base connections with walletConnecting: true
      // NOTE: setIsConnectingMetaMask starts async work but doesn't await it
      // We need to wait a bit to ensure the JSON is created before proceeding
      setIsConnectingMetaMask(true);
      console.log('[VavityTester handleConnectAsset] setIsConnectingMetaMask(true) called (async work started)');
      
      // Give the async function a moment to start executing
      await new Promise(resolve => setTimeout(resolve, 100));
      // setIsConnectingBase just calls setIsConnectingMetaMask, so we don't need to call it separately
      
      // Then proceed with actual wallet connection
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
      
      // Reset connecting state when user cancels or connection fails
      console.log('[VavityTester handleConnectAsset] Resetting connecting state to false for both wallets');
      await setIsConnectingMetaMask(false);
      await setIsConnectingBase(false);
      console.log('[VavityTester handleConnectAsset] Connecting state reset complete');
      
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
            disabled={metaMaskWalletConnecting}
            style={{
              padding: '10px 20px',
              backgroundColor: metaMaskWalletConnecting ? '#333333' : '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: metaMaskWalletConnecting ? 'not-allowed' : 'pointer',
              marginRight: '10px',
            }}
          >
            {metaMaskWalletConnecting ? 'CONNECTING...' : 'CONNECT ETHEREUM'}
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          <div>Wallet Connected: {metaMaskWalletConnected ? 'Yes' : 'No'}</div>
          <div>Wallet Connecting: {metaMaskWalletConnecting ? 'Yes' : 'No'}</div>
          <div>Asset Connected: {metaMaskAssetConnected ? 'Yes' : 'No'}</div>
          <div>Asset Connecting: {metaMaskAssetConnecting ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Base</h2>
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => handleConnectAsset('base')}
            disabled={baseWalletConnecting}
            style={{
              padding: '10px 20px',
              backgroundColor: baseWalletConnecting ? '#333333' : '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: baseWalletConnecting ? 'not-allowed' : 'pointer',
              marginRight: '10px',
            }}
          >
            {baseWalletConnecting ? 'CONNECTING...' : 'CONNECT ETHEREUM'}
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          <div>Wallet Connected: {baseWalletConnected ? 'Yes' : 'No'}</div>
          <div>Wallet Connecting: {baseWalletConnecting ? 'Yes' : 'No'}</div>
          <div>Asset Connected: {baseAssetConnected ? 'Yes' : 'No'}</div>
          <div>Asset Connecting: {baseAssetConnecting ? 'Yes' : 'No'}</div>
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
