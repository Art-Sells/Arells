'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useVavityAssetConnect } from '../../context/VavityAssetConnectContext';
import { useVavity } from '../../context/VavityAggregator';
import axios from 'axios';

const VavityTester: React.FC = () => {
  const { email, vapa, assetPrice, fetchVavityAggregator, addVavityAggregator } = useVavity();
  const {
    metaMaskAssetConnected,
    baseAssetConnected,
    connectAsset,
    triggerDeposit,
  } = useVavityAssetConnect();

  const [connectionState, setConnectionState] = useState<any>(null);
  const [loadingMetaMask, setLoadingMetaMask] = useState<boolean>(false);
  const [loadingBase, setLoadingBase] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalWalletType, setModalWalletType] = useState<'metamask' | 'base' | null>(null);
  const [isWalletAlreadyConnected, setIsWalletAlreadyConnected] = useState<boolean>(false);
  const [showConnectingModal, setShowConnectingModal] = useState<boolean>(false);
  const [vavityData, setVavityData] = useState<any>(null);

  // Check pending connections - use useCallback to memoize
  const checkPending = useCallback(async () => {
    if (!email) {
      console.log('[VavityTester checkPending] No email available, skipping');
      return;
    }
    
    try {
      console.log('[VavityTester checkPending] Fetching connections for email:', email);
      const response = await axios.get('/api/saveVavityConnection', { params: { email } });
      const connections = response.data.vavityConnections || [];
      
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

  // Check and add missing wallets from pending connections
  const checkAndAddMissingWallets = useCallback(async () => {
    if (!email || !fetchVavityAggregator || !connectionState || !addVavityAggregator) return;
    
    try {
      // Get VavityAggregator data
      const vavityData = await fetchVavityAggregator(email);
      const existingWallets = vavityData?.wallets || [];
      const existingAddresses = new Set(existingWallets.map((w: any) => w.address?.toLowerCase()));
      
      // Check if Base wallet is missing
      const baseConn = connectionState.baseConn;
      if (baseConn && baseConn.assetConnected && baseConn.address) {
        const baseAddress = baseConn.address.toLowerCase();
        if (!existingAddresses.has(baseAddress)) {
          console.log('[VavityTester] Base wallet missing from VavityAggregator, adding it...');
          // Base wallet is connected but not in VavityAggregator - add it
          const tokenAddress = '0x0000000000000000000000000000000000000000';
          
          try {
            // Fetch balance
            const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(baseConn.address)}&tokenAddress=${encodeURIComponent(tokenAddress)}`);
            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              const balance = parseFloat(balanceData.balance || '0');
              
              const currentVapaValue = Math.max(assetPrice || 0, vapa || 0);
              const newCVactTaa = balance;
              const newCpVact = currentVapaValue;
              const newCVact = newCVactTaa * newCpVact;
              const newCVatoc = newCVact;
              const newCpVatoc = currentVapaValue;
              const newCdVatoc = newCVact - newCVatoc;
              
              const walletData = {
                walletId: baseConn.walletId || `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                address: baseConn.address,
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
              console.log('[VavityTester] Successfully added Base wallet to VavityAggregator');
            }
          } catch (error) {
            console.error('[VavityTester] Error adding Base wallet to VavityAggregator:', error);
          }
        }
      }
    } catch (error) {
      console.error('[VavityTester] Error checking for missing wallets:', error);
    }
  }, [email, fetchVavityAggregator, connectionState, addVavityAggregator, assetPrice, vapa]);

  // Fetch VavityAggregator data - display backend values directly, don't recalculate
  const fetchVavityData = useCallback(async () => {
    if (!email || !fetchVavityAggregator) return;
    try {
      const data = await fetchVavityAggregator(email);
      // Trust backend values - only recalculate if backend values are missing or invalid
      if (data.wallets && Array.isArray(data.wallets)) {
        data.wallets = data.wallets.map((wallet: any) => {
          // Only recalculate cdVatoc if it's missing or invalid
          const calculatedCdVatoc = (wallet.cVact || 0) - (wallet.cVatoc || 0);
          const finalCdVatoc = wallet.cdVatoc !== undefined && wallet.cdVatoc !== null 
            ? wallet.cdVatoc 
            : parseFloat(calculatedCdVatoc.toFixed(2));
          
          // Ensure cVact is not 0 if cVactTaa and cpVact exist
          let finalCVact = wallet.cVact || 0;
          if (finalCVact === 0 && wallet.cVactTaa && wallet.cpVact) {
            finalCVact = wallet.cVactTaa * wallet.cpVact;
            console.warn('[VavityTester] cVact was 0, recalculated from cVactTaa * cpVact:', finalCVact);
          }
          
          // Ensure cpVact matches VAPA if it's significantly different
          // VAPA should be the highest price, so cpVact should be >= VAPA
          const finalCpVact = wallet.cpVact || 0;
          if (vapa && finalCpVact > 0 && finalCpVact < vapa * 0.9) {
            console.warn('[VavityTester] cpVact is lower than VAPA, this may indicate a sync issue');
          }
          
          return {
            ...wallet,
            cdVatoc: finalCdVatoc,
            cVact: finalCVact,
            // Ensure vapaa is always set
            vapaa: wallet.vapaa || '0x0000000000000000000000000000000000000000',
          };
        });
      }
      // Use backend vavityCombinations directly - they're already calculated correctly
      // Only recalculate if missing
      if (!data.vavityCombinations || Object.keys(data.vavityCombinations).length === 0) {
        if (data.wallets && Array.isArray(data.wallets)) {
          const combinationsByVapaa: Record<string, {
            acVatoc: number;
            acVact: number;
            acdVatoc: number;
            acVactTaa: number;
          }> = {};
          
          data.wallets.forEach((wallet: any) => {
            const vapaa = wallet.vapaa || '0x0000000000000000000000000000000000000000';
            
            if (!combinationsByVapaa[vapaa]) {
              combinationsByVapaa[vapaa] = {
                acVatoc: 0,
                acVact: 0,
                acdVatoc: 0,
                acVactTaa: 0,
              };
            }
            
            combinationsByVapaa[vapaa].acVatoc += wallet.cVatoc || 0;
            combinationsByVapaa[vapaa].acVact += wallet.cVact || 0;
            combinationsByVapaa[vapaa].acdVatoc += wallet.cdVatoc || 0;
            combinationsByVapaa[vapaa].acVactTaa += wallet.cVactTaa || 0;
          });
          
          data.vavityCombinations = combinationsByVapaa;
        }
      }
      setVavityData(data);
    } catch (error) {
      console.error('[VavityTester] Error fetching VavityAggregator data:', error);
    }
  }, [email, fetchVavityAggregator, vapa]);

  useEffect(() => {
    console.log('[VavityTester] Component mounted, email:', email);
    checkPending();
    fetchVavityData();
    checkAndAddMissingWallets();
    // More frequent polling to catch updates faster
    const interval = setInterval(checkPending, 2000);
    const vavityInterval = setInterval(fetchVavityData, 1500); // Poll every 1.5 seconds for faster sync
    const missingWalletsInterval = setInterval(checkAndAddMissingWallets, 5000);
    return () => {
      console.log('[VavityTester] Component unmounting, clearing intervals');
      clearInterval(interval);
      clearInterval(vavityInterval);
      clearInterval(missingWalletsInterval);
    };
  }, [checkPending, email, fetchVavityData, checkAndAddMissingWallets]);

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
      // Trigger deposit - this returns as soon as txHash is received
      await triggerDeposit(walletType);
      
      // Keep modal open and poll until wallet appears in backend with correct values
      // This ensures frontend numbers match backend before closing
      const connection = connectionState?.[walletType === 'metamask' ? 'metamaskConn' : 'baseConn'];
      const walletAddress = connection?.address;
      
      if (walletAddress) {
        let pollCount = 0;
        const maxPolls = 30; // Poll for up to 60 seconds (30 * 2 seconds)
        const checkWalletCreated = setInterval(async () => {
          pollCount++;
          await checkPending();
          await fetchVavityData();
          
          // Check if wallet was created in VavityAggregator with correct values
          try {
            const data = await fetchVavityAggregator(email);
            const wallets = data?.wallets || [];
            const wallet = wallets.find((w: any) => 
              w.address?.toLowerCase() === walletAddress?.toLowerCase() &&
              w.depositPaid === true
            );
            
            // Check if wallet exists with depositPaid and has valid cpVact (VAPA)
            // cVact might be 0 if balance is very small, so we only check cpVact
            if (wallet && wallet.depositPaid === true && wallet.cpVact > 0) {
              // Wallet exists with valid values - close modal immediately
              console.log('[VavityTester] Wallet found in backend with correct values, closing modal', {
                address: wallet.address,
                depositPaid: wallet.depositPaid,
                cpVact: wallet.cpVact,
                cVact: wallet.cVact
              });
              setShowConnectingModal(false);
              clearInterval(checkWalletCreated);
              return;
            }
          } catch (error) {
            console.error('[VavityTester] Error checking wallet creation:', error);
          }
          
          if (pollCount >= maxPolls) {
            console.warn('[VavityTester] Max polls reached, closing modal anyway');
            setShowConnectingModal(false);
            clearInterval(checkWalletCreated);
          }
        }, 2000);
      } else {
        // No wallet address - close modal after short delay
        setTimeout(() => {
          setShowConnectingModal(false);
        }, 2000);
      }
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
        <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '10px' }}>
          Email: {email || 'Not available'}
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '5px' }}>
          Ethereum Price: ${assetPrice ? assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </div>
        <div style={{ fontSize: '14px', color: '#ffffff' }}>
          VAPA: ${vapa ? vapa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
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
      
      {/* VAPA and Wallet Breakdown */}
      {vavityData && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>VAPA Breakdown</h3>
          
          {/* VAPA Header */}
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
              VAPA: ${vapa ? vapa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>

          {/* Wallets */}
          {vavityData.wallets && Array.isArray(vavityData.wallets) && vavityData.wallets.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#ffffff', marginBottom: '10px' }}>Wallets:</h4>
              {vavityData.wallets.map((wallet: any, index: number) => (
                <div key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
                  <div style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}>
                    Wallet {index + 1}: {wallet.address?.substring(0, 6)}...{wallet.address?.substring(wallet.address.length - 4)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cccccc', marginLeft: '10px' }}>
                    <div>VAPAA: {wallet.vapaa || '0x0000000000000000000000000000000000000000'}</div>
                    <div>cVatoc: ${(wallet.cVatoc || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>cpVatoc: ${(wallet.cpVatoc || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>cVact: ${(wallet.cVact || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>cpVact: ${(wallet.cpVact || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>cVactTaa: {(wallet.cVactTaa || 0).toFixed(5)}</div>
                    <div>cdVatoc: ${(wallet.cdVatoc || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wallet Totals (Vavity Combinations) */}
          {vavityData.vavityCombinations && Object.keys(vavityData.vavityCombinations).length > 0 && (
            <div>
              <h4 style={{ color: '#ffffff', marginBottom: '10px' }}>Wallet Totals:</h4>
              {Object.entries(vavityData.vavityCombinations).map(([vapaa, combo]: [string, any]) => (
                <div key={vapaa} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
                  <div style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '8px' }}>
                    VAPAA: {vapaa || '0x0000000000000000000000000000000000000000'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cccccc', marginLeft: '10px' }}>
                    <div>acVatoc: ${(combo.acVatoc || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>acdVatoc: ${(combo.acdVatoc || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>acVact: ${(combo.acVact || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div>acVactTaa: {(combo.acVactTaa || 0).toFixed(5)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
