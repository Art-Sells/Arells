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
    triggerDeposit,
  } = useAssetConnect();

  const [connectionState, setConnectionState] = useState<any>(null);
  const [loadingMetaMask, setLoadingMetaMask] = useState<boolean>(false);
  const [loadingBase, setLoadingBase] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalWalletType, setModalWalletType] = useState<'metamask' | 'base' | null>(null);
  const [isWalletAlreadyConnected, setIsWalletAlreadyConnected] = useState<boolean>(false);
  const [showConnectingModal, setShowConnectingModal] = useState<boolean>(false);

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

    // Check if wallet is already connected
    let walletAlreadyConnected = false;
    try {
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
        const accounts = await provider.request({ method: 'eth_accounts' });
        walletAlreadyConnected = accounts && accounts.length > 0;
      }
    } catch (error) {
      console.log('[VavityTester] Could not check if wallet is connected:', error);
      walletAlreadyConnected = false;
    }

    if (walletAlreadyConnected) {
      // Wallet is already connected - show simpler modal directly
      console.log('[VavityTester] Wallet already connected, showing deposit modal');
      setIsWalletAlreadyConnected(true);
      setModalWalletType(walletType);
      setShowModal(true);
      
      // Clear loading state
      if (walletType === 'metamask') {
        setLoadingMetaMask(false);
      } else {
        setLoadingBase(false);
      }
      return;
    }

    // Wallet not connected - connect it first
    console.log('[VavityTester handleConnectAsset] Connecting wallet for:', walletType);
    try {
      await connectAsset(walletType);
      // On successful connection, show modal with "Wallet Connection Successful"
      setIsWalletAlreadyConnected(false);
      setModalWalletType(walletType);
      setShowModal(true);
    } catch (error: any) {
      console.error('[VavityTester handleConnectAsset] Error:', error);
      const isUserRejection = error?.code === 4001 || error?.message?.includes('rejected') || error?.message === 'User rejected';
      
      if (isUserRejection) {
        // Show alert for cancellation
        alert('Wallet connection canceled');
      } else if (!error?.response) {
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

  const handleModalYes = async () => {
    if (!modalWalletType) return;
    
    const walletType = modalWalletType;
    
    // Close confirmation modal and show connecting modal
    setShowModal(false);
    setShowConnectingModal(true);
    setModalWalletType(null);
    
    // Set loading state
    if (walletType === 'metamask') {
      setLoadingMetaMask(true);
    } else {
      setLoadingBase(true);
    }
    
    try {
      await triggerDeposit(walletType);
      // Refresh connection state to update button
      await checkPending();
      // Hide connecting modal after successful deposit
      setShowConnectingModal(false);
    } catch (error: any) {
      console.error('[VavityTester handleModalYes] Error:', error);
      // Hide connecting modal on error
      setShowConnectingModal(false);
      const isUserRejection = error?.code === 4001 || error?.message?.includes('rejected') || error?.message === 'User rejected';
      
      if (isUserRejection) {
        alert('Wallet connection canceled');
      } else {
        alert(`Error connecting asset: ${error.message}`);
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

  const handleModalNo = () => {
    setShowModal(false);
    setModalWalletType(null);
    setIsWalletAlreadyConnected(false);
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
            disabled={loadingMetaMask || metaMaskAssetConnected}
            style={{
              padding: '10px 20px',
              backgroundColor: metaMaskAssetConnected ? '#28a745' : (loadingMetaMask ? '#666666' : '#0066cc'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: (loadingMetaMask || metaMaskAssetConnected) ? 'not-allowed' : 'pointer',
              marginRight: '10px',
              opacity: (loadingMetaMask || metaMaskAssetConnected) ? 0.8 : 1,
            }}
          >
            {loadingMetaMask ? 'PROCESSING...' : (metaMaskAssetConnected ? 'CONNECTED' : 'CONNECT ETHEREUM')}
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
            disabled={loadingBase || baseAssetConnected}
            style={{
              padding: '10px 20px',
              backgroundColor: baseAssetConnected ? '#28a745' : (loadingBase ? '#666666' : '#0066cc'),
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: (loadingBase || baseAssetConnected) ? 'not-allowed' : 'pointer',
              marginRight: '10px',
              opacity: (loadingBase || baseAssetConnected) ? 0.8 : 1,
            }}
          >
            {loadingBase ? 'PROCESSING...' : (baseAssetConnected ? 'CONNECTED' : 'CONNECT ETHEREUM')}
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

      {/* Modal for wallet connection success */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={handleModalNo}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '30px',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '90%',
              border: '2px solid #0066cc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!isWalletAlreadyConnected && (
              <h2 style={{ color: '#ffffff', marginBottom: '20px', textAlign: 'center' }}>
                Wallet Connection Successful
              </h2>
            )}
            <p style={{ color: '#ffffff', marginBottom: '30px', textAlign: 'center', fontSize: '16px' }}>
              Connect Ethereum to Begin .5% fee per new assets.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button
                onClick={handleModalYes}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#0066cc',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                Yes
              </button>
              <button
                onClick={handleModalNo}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#666666',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for connecting ethereum */}
      {showConnectingModal && (
        <>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner {
              animation: spin 1s linear infinite;
            }
          `}</style>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1001,
            }}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '30px',
                borderRadius: '10px',
                maxWidth: '400px',
                width: '90%',
                border: '2px solid #0066cc',
                textAlign: 'center',
              }}
            >
              <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>
                Connecting Ethereum
              </h2>
              <p style={{ color: '#ffffff', fontSize: '14px', marginBottom: '20px' }}>
                Do not reload this page to ensure successful connection
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <div
                  className="spinner"
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #333',
                    borderTop: '4px solid #0066cc',
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VavityTester;
