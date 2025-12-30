'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAssetConnect } from '../../context/AssetConnectContext';
import { useVavity } from '../../context/VavityAggregator';
import axios from 'axios';

const VavityTester: React.FC = () => {
  const { email } = useVavity();
  const {
    metaMaskAssetConnected,
    baseAssetConnected,
    connectAsset,
  } = useAssetConnect();

  const [connectionState, setConnectionState] = useState<any>(null);
  const [loadingMetaMask, setLoadingMetaMask] = useState<boolean>(false);
  const [loadingBase, setLoadingBase] = useState<boolean>(false);

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
      
      // Use most recent connection
      const metamaskConnections = connections.filter((pc: any) => pc.walletType === 'metamask');
      const metamaskConn = metamaskConnections.length > 0
        ? metamaskConnections.reduce((latest, current) => 
            (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
          )
        : {
            address: '0x0000000000000000000000000000000000000000',
            assetConnected: false,
          };
      
      const baseConnections = connections.filter((pc: any) => pc.walletType === 'base');
      const baseConn = baseConnections.length > 0
        ? baseConnections.reduce((latest, current) => 
            (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
          )
        : {
            address: '0x0000000000000000000000000000000000000000',
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

    // Set loading state
    if (walletType === 'metamask') {
      setLoadingMetaMask(true);
    } else {
      setLoadingBase(true);
    }

    // Simply connect wallet and trigger deposit - no walletConnected checks needed
    console.log('[VavityTester handleConnectAsset] Connecting wallet and triggering deposit for:', walletType);
    try {
      await connectAsset(walletType);
    } catch (error: any) {
      console.error('[VavityTester handleConnectAsset] Error:', error);
      const isUserRejection = error?.code === 4001 || error?.message?.includes('rejected') || error?.message === 'User rejected';
      
      // Silently handle user rejections and HTTP errors
      if (!isUserRejection && !error?.response) {
        alert(`Error connecting ${walletType}: ${error.message}`);
      }
    } finally {
      // Clear loading state
      if (walletType === 'metamask') {
        setLoadingMetaMask(false);
      } else {
        setLoadingBase(false);
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
            disabled={loadingMetaMask}
            style={{
              padding: '10px 20px',
              backgroundColor: loadingMetaMask ? '#666666' : '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: loadingMetaMask ? 'not-allowed' : 'pointer',
              marginRight: '10px',
              opacity: loadingMetaMask ? 0.6 : 1,
            }}
          >
            {loadingMetaMask ? 'PROCESSING...' : 'CONNECT ETHEREUM'}
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          <div>Asset Connected: {metaMaskAssetConnected ? 'Yes' : 'No'}</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Base</h2>
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => handleConnectAsset('base')}
            disabled={loadingBase}
            style={{
              padding: '10px 20px',
              backgroundColor: loadingBase ? '#666666' : '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: loadingBase ? 'not-allowed' : 'pointer',
              marginRight: '10px',
              opacity: loadingBase ? 0.6 : 1,
            }}
          >
            {loadingBase ? 'PROCESSING...' : 'CONNECT ETHEREUM'}
          </button>
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
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
