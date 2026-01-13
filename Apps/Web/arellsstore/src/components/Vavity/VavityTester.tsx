'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useVavityAssetConnect } from '../../context/VavityAssetConnectContext';
import { useVavity } from '../../context/VavityAggregator';
import axios from 'axios';

const VavityTester: React.FC = () => {
  const { email, vapa, assetPrice, fetchVavityAggregator, addVavityAggregator, setIsConnectingAsset, walletBalances } = useVavity();
  const {
    metaMaskAssetConnected,
    baseAssetConnected,
    connectAsset,
    triggerDeposit,
  } = useVavityAssetConnect();

  const [connectionState, setConnectionState] = useState<any>(null);
  const connectionStateRef = React.useRef<any>(null);
  const [loadingMetaMask, setLoadingMetaMask] = useState<boolean>(false);
  const [loadingBase, setLoadingBase] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalWalletType, setModalWalletType] = useState<'metamask' | 'base' | null>(null);
  const [isWalletAlreadyConnected, setIsWalletAlreadyConnected] = useState<boolean>(false);
  const [showConnectingModal, setShowConnectingModal] = useState<boolean>(false);
  const [connectingWalletTypeForModal, setConnectingWalletTypeForModal] = useState<'metamask' | 'base' | null>(null);
  const [vavityData, setVavityData] = useState<any>(null);
  const [showConnectMoreMetaMask, setShowConnectMoreMetaMask] = useState<boolean>(false);
  const [showConnectMoreBase, setShowConnectMoreBase] = useState<boolean>(false);
  const [metaMaskDepositPaid, setMetaMaskDepositPaid] = useState<boolean>(false);
  const [baseDepositPaid, setBaseDepositPaid] = useState<boolean>(false);

  // Check pending connections - use useCallback to memoize
  const checkPending = useCallback(async () => {
    if (!email) {
      return;
    }
    
    try {
      const response = await axios.get('/api/saveVavityConnection', { params: { email } });
      const connections = response.data.vavityConnections || [];
      
      // Use most recent connection
      const metamaskConnections = connections.filter((pc: any) => pc.walletType === 'metamask');
      const metamaskConn = metamaskConnections.length > 0
        ? metamaskConnections.reduce((latest: any, current: any) => 
            (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
          )
        : {
            address: '0x0000000000000000000000000000000000000000',
            assetConnected: false,
          };
      
      const baseConnections = connections.filter((pc: any) => pc.walletType === 'base');
      const baseConn = baseConnections.length > 0
        ? baseConnections.reduce((latest: any, current: any) => 
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
      connectionStateRef.current = state; // Update ref for closure access
    } catch (error: any) {
      // Silently handle HTTP errors - don't log to console to avoid spam
      if (error?.response?.status !== 401 && error?.response?.status !== 500) {
      }
    }
  }, [email]);

  // Check and add missing wallets from pending connections
  // NOTE: This is only for legacy wallets that were connected before the new system
  // New wallets are created by connectVavityAsset.ts, so this should not interfere
  const checkAndAddMissingWallets = useCallback(async () => {
    if (!email || !fetchVavityAggregator || !connectionState || !addVavityAggregator) return;
    
    try {
      // Get VavityAggregator data
      const vavityData = await fetchVavityAggregator(email);
      const existingWallets = vavityData?.wallets || [];
      const existingAddresses = new Set(existingWallets.map((w: any) => w.address?.toLowerCase()));
      
      // Check if wallet exists with depositPaid: true - if so, don't try to add it
      // This prevents conflicts with wallets created by connectVavityAsset.ts
      const hasWalletWithDepositPaid = (address: string) => {
        return existingWallets.some((w: any) => 
          w.address?.toLowerCase() === address.toLowerCase() && 
          w.depositPaid === true
        );
      };
      
      // Check if Base wallet is missing
      const baseConn = connectionState.baseConn;
      if (baseConn && baseConn.assetConnected && baseConn.address) {
        const baseAddress = baseConn.address.toLowerCase();
        // Only add if wallet doesn't exist AND doesn't have depositPaid: true
        // This prevents adding wallets that were just created by connectVavityAsset.ts
        if (!existingAddresses.has(baseAddress) && !hasWalletWithDepositPaid(baseAddress)) {
          // Base wallet is connected but not in VavityAggregator - add it (legacy case only)
          const tokenAddress = '0x0000000000000000000000000000000000000000';
          
          try {
            // Fetch balance
            const balanceResponse = await fetch(`/api/tokenBalance?address=${encodeURIComponent(baseConn.address)}&tokenAddress=${encodeURIComponent(tokenAddress)}`);
            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              const balance = parseFloat(balanceData.balance || '0');
              
              // Only add if balance > 1 wei (same threshold as elsewhere)
              const MIN_BALANCE_THRESHOLD = 0.000000000000000001;
              if (balance <= MIN_BALANCE_THRESHOLD) {
                return; // Don't add wallets with 0 balance
              }
              
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
            }
          } catch (error) {
          }
        }
      }
    } catch (error) {
    }
  }, [email, fetchVavityAggregator, connectionState, addVavityAggregator, assetPrice, vapa]);

  // Fetch VavityAggregator data - display backend values directly, don't recalculate
  const fetchVavityData = useCallback(async () => {
    if (!email || !fetchVavityAggregator) return;
    try {
      const data = await fetchVavityAggregator(email);
      // Display backend values directly - no recalculations
      setVavityData(data);
    } catch (error) {
    }
  }, [email, fetchVavityAggregator]);

  useEffect(() => {
    checkPending();
    fetchVavityData();
    // DISABLED: checkAndAddMissingWallets - this was causing conflicts with connectVavityAsset.ts
    // All wallets are now created through connectVavityAsset.ts, so this function is no longer needed
    // checkAndAddMissingWallets();
    // More frequent polling to catch updates faster
    const interval = setInterval(checkPending, 2000);
    const vavityInterval = setInterval(fetchVavityData, 1500); // Poll every 1.5 seconds for faster sync
    // DISABLED: missingWalletsInterval - was causing create/delete loops
    // const missingWalletsInterval = setInterval(checkAndAddMissingWallets, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(vavityInterval);
      // clearInterval(missingWalletsInterval);
    };
  }, [checkPending, email, fetchVavityData]);

  // Update depositPaid states when vavityData or connectionState changes
  useEffect(() => {
    if (!vavityData || !connectionState) {
      setMetaMaskDepositPaid(false);
      setBaseDepositPaid(false);
      return;
    }

    const wallets = vavityData.wallets || [];
    const metamaskConn = connectionState.metamaskConn;
    const baseConn = connectionState.baseConn;

    // Check MetaMask
    if (metamaskConn && metamaskConn.address && metamaskConn.address !== '0x0000000000000000000000000000000000000000') {
      const walletAddress = metamaskConn.address.toLowerCase();
      const matchingWallet = wallets.find((w: any) => 
        w.address?.toLowerCase() === walletAddress &&
        w.depositPaid === true
      );
      const depositPaid = matchingWallet?.depositPaid === true;
      setMetaMaskDepositPaid(depositPaid);
      console.log(`[VavityTester] MetaMask depositPaid check: address=${walletAddress}, found=${!!matchingWallet}, depositPaid=${depositPaid}`);
    } else {
      setMetaMaskDepositPaid(false);
      console.log(`[VavityTester] MetaMask depositPaid check: no valid connection`, { metamaskConn });
    }

    // Check Base
    if (baseConn && baseConn.address && baseConn.address !== '0x0000000000000000000000000000000000000000') {
      const walletAddress = baseConn.address.toLowerCase();
      const matchingWallet = wallets.find((w: any) => 
        w.address?.toLowerCase() === walletAddress &&
        w.depositPaid === true
      );
      const depositPaid = matchingWallet?.depositPaid === true;
      setBaseDepositPaid(depositPaid);
      console.log(`[VavityTester] Base depositPaid check: address=${walletAddress}, found=${!!matchingWallet}, depositPaid=${depositPaid}`);
    } else {
      setBaseDepositPaid(false);
      console.log(`[VavityTester] Base depositPaid check: no valid connection`, { baseConn });
    }
  }, [vavityData, connectionState]);

  // Display "Connect More Ethereum" button based on assetConnected from backend
  useEffect(() => {
    if (!connectionState || !vavityData) {
      setShowConnectMoreMetaMask(false);
      setShowConnectMoreBase(false);
      return;
    }

    const metamaskConn = connectionState.metamaskConn;
    const baseConn = connectionState.baseConn;
    const wallets = vavityData.wallets || [];

    // Check MetaMask: Show "Connect More" only if assetConnected === false AND depositPaid === true AND wallet exists with cVactTaa > 0
    if (metamaskConn && metamaskConn.address && metamaskConn.address !== '0x0000000000000000000000000000000000000000') {
      const walletAddress = metamaskConn.address.toLowerCase();
      const matchingWallet = wallets.find((w: any) => 
        w.address?.toLowerCase() === walletAddress &&
        w.depositPaid === true
      );
      const hasExistingConnection = matchingWallet && (matchingWallet.cVactTaa || 0) > 0;
      setShowConnectMoreMetaMask(
        metamaskConn.assetConnected === false && 
        metaMaskDepositPaid === true && 
        hasExistingConnection === true
      );
    } else {
      setShowConnectMoreMetaMask(false);
    }

    // Check Base: Show "Connect More" only if assetConnected === false AND depositPaid === true AND wallet exists with cVactTaa > 0
    if (baseConn && baseConn.address && baseConn.address !== '0x0000000000000000000000000000000000000000') {
      const walletAddress = baseConn.address.toLowerCase();
      const matchingWallet = wallets.find((w: any) => 
        w.address?.toLowerCase() === walletAddress &&
        w.depositPaid === true
      );
      const hasExistingConnection = matchingWallet && (matchingWallet.cVactTaa || 0) > 0;
      setShowConnectMoreBase(
        baseConn.assetConnected === false && 
        baseDepositPaid === true && 
        hasExistingConnection === true
      );
    } else {
      setShowConnectMoreBase(false);
    }
  }, [connectionState, vavityData, metaMaskDepositPaid, baseDepositPaid]);

  // Helper function to determine depositPaid status for a wallet
  const getDepositPaidStatus = useCallback((walletType: 'metamask' | 'base'): 'null' | 'false' | 'true' => {
    if (!vavityData || !connectionState) return 'null';
    
    const wallets = vavityData.wallets || [];
    const conn = walletType === 'metamask' ? connectionState.metamaskConn : connectionState.baseConn;
    
    if (!conn || !conn.address || conn.address === '0x0000000000000000000000000000000000000000') {
      return 'null';
    }
    
    const walletAddress = conn.address.toLowerCase();
    const matchingWallet = wallets.find((w: any) => w.address?.toLowerCase() === walletAddress);
    
    if (!matchingWallet) {
      return 'null'; // Wallet doesn't exist yet
    }
    
    if (matchingWallet.depositPaid === true) {
      return 'true';
    }
    
    return 'false'; // Wallet exists but depositPaid is not true
  }, [vavityData, connectionState]);

  // Component to display balance from fetchBalance (display-only, never stored)
  const ConnectMoreEthSection: React.FC<{
    walletAddress: string;
    walletType: 'metamask' | 'base';
    onConnectClick: () => void;
  }> = ({ walletAddress, walletType, onConnectClick }) => {
    // Get balance from fetchBalance's temporary display-only state (never stored in wallet objects)
    const currentBalance = walletBalances[walletAddress.toLowerCase()] ?? null;

    // Don't show if balance hasn't been fetched yet or is zero
    if (currentBalance === null || currentBalance === 0) return null;

    // Check if this wallet type is currently loading or if any modal is open
    const isLoading = (walletType === 'metamask' && loadingMetaMask) || (walletType === 'base' && loadingBase);
    const isDisabled = isLoading || showModal || showConnectingModal;

    // Calculate before and after dollar amounts
    const beforeConnection = currentBalance * assetPrice;
    const afterConnection = currentBalance * vapa;

    return (
      <div style={{ 
        marginBottom: '15px', 
        padding: '15px', 
        backgroundColor: '#2d2d2d', 
        borderRadius: '5px',
        border: '1px solid #ff9800'
      }}>
        <div style={{ color: '#ffffff', marginBottom: '10px', fontSize: '14px' }}>
          Your "ETH" amount increased.
        </div>
        <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '5px' }}>
          Before connection: ${beforeConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
        </div>
        <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '10px' }}>
          After connection: ${afterConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
        </div>
        <div style={{ color: '#ffffff', fontSize: '14px' }}>
          <span
            onClick={isDisabled ? undefined : onConnectClick}
            style={{
              color: isDisabled ? '#666666' : '#ff9800',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              textDecoration: 'underline',
              fontWeight: 'bold',
              opacity: isDisabled ? 0.6 : 1,
            }}
          >
            (Connect More Eth)
          </span>
        </div>
      </div>
    );
  };

  const handleConnectAsset = async (walletType: 'metamask' | 'base') => {
    if (!email) {
      return;
    }

    // Check if this is a "Connect More Ethereum" action
    const isConnectMore = (walletType === 'metamask' && showConnectMoreMetaMask) || (walletType === 'base' && showConnectMoreBase);

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
      walletAlreadyConnected = false;
    }

    if (walletAlreadyConnected) {
      // Wallet is already connected - show simpler modal directly
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
    // CRITICAL: Clear modal state before attempting connection to prevent stale state
    setShowModal(false);
    setModalWalletType(null);
    
    let connectionSuccessful = false;
    let errorOccurred = false;
    try {
      await connectAsset(walletType);
      // Only mark as successful if we got here without throwing AND no error occurred
      if (!errorOccurred) {
        connectionSuccessful = true;
        // On successful connection, show modal with "Wallet Connection Successful"
        // Only show modal if connection was actually successful (not cancelled)
        setIsWalletAlreadyConnected(false);
        setModalWalletType(walletType);
        setShowModal(true);
      } else {
        setShowModal(false);
        setModalWalletType(null);
      }
    } catch (error: any) {
      // CRITICAL: Clear modal state immediately on error to prevent success modal from showing
      errorOccurred = true;
      connectionSuccessful = false;
      setShowModal(false);
      setModalWalletType(null);
      
      // Check for user rejection/cancellation - be more thorough
      const errorMessage = String(error?.message || error?.toString() || '');
      const errorCode = error?.code || error?.error?.code;
      const isUserRejection = 
        errorCode === 4001 || 
        errorCode === 'ACTION_REJECTED' ||
        errorMessage.toLowerCase().includes('user rejected') ||
        errorMessage.toLowerCase().includes('user cancelled') ||
        errorMessage.toLowerCase().includes('user denied') ||
        errorMessage.toLowerCase().includes('rejected') ||
        errorMessage.toLowerCase().includes('cancelled') ||
        errorMessage.toLowerCase().includes('denied');
      
      
      if (isUserRejection) {
        // Show alert for cancellation - same for both MetaMask and Base
        alert('Wallet connection canceled');
        // Make sure modal is not shown
        setShowModal(false);
        setModalWalletType(null);
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
    console.log('[VavityTester] 🎯 handleModalYes called');
    if (!modalWalletType) {
      console.log('[VavityTester] ⚠️ No modalWalletType, returning');
      return;
    }
    
    const walletType = modalWalletType;
    const isConnectMore = (walletType === 'metamask' && showConnectMoreMetaMask) || (walletType === 'base' && showConnectMoreBase);
    console.log(`[VavityTester] 🎯 Wallet type: ${walletType}, isConnectMore: ${isConnectMore}`);
    
    // Close confirmation modal and show connecting modal
    setShowModal(false);
    setModalWalletType(null);
    
    // Close confirmation modal and show connecting modal
    setConnectingWalletTypeForModal(walletType); // Store for modal title
    setShowConnectingModal(true);
    
    // Set loading state
    if (walletType === 'metamask') {
      setLoadingMetaMask(true);
    } else {
      setLoadingBase(true);
    }
    
    // CRITICAL: Wait for React to render the modal before triggering deposit
    // This ensures the modal is visible even if triggerDeposit throws an error immediately
    // Use requestAnimationFrame twice to ensure the render cycle completes
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });
    });
    
    try {
      console.log(`[VavityTester] 🚀 About to trigger deposit for ${walletType}`);
      // Trigger deposit - this returns as soon as txHash is received
      await triggerDeposit(walletType);
      console.log(`[VavityTester] ✅ Deposit triggered successfully`);
      
      // Keep modal open and poll until assetConnected: true is detected in connection state
      // This matches the original code structure - assetConnected is set LAST after all VavityAggregator updates
      // Use connectionStateRef.current to get the latest connection state (not stale closure)
      const currentStateForAddress = connectionStateRef.current;
      const connection = currentStateForAddress?.[walletType === 'metamask' ? 'metamaskConn' : 'baseConn'];
      const walletAddress = connection?.address;
      
      if (walletAddress) {
        let pollCount = 0;
        const maxPolls = 120; // Poll for up to 60 seconds (120 * 500ms)
        
        // Check immediately first (before starting interval)
        await checkPending();
        await fetchVavityData();
        
        // Check if assetConnected is already true from connectionStateRef (after checkPending updated it)
        const currentState = connectionStateRef.current;
        const currentConnection = currentState?.[walletType === 'metamask' ? 'metamaskConn' : 'baseConn'];
        if (currentConnection?.assetConnected === true) {
          console.log('[VavityTester] ✅ assetConnected=true found, closing modal', {
            walletType,
            address: currentConnection.address,
            assetConnected: currentConnection.assetConnected
          });
          setShowConnectingModal(false);
          setConnectingWalletTypeForModal(null);
          setIsConnectingAsset(false);
          // Refresh state after closing modal
          await checkPending();
          await fetchVavityData();
          return; // Exit early if already connected
        }
        
        // If not connected yet, start aggressive polling (every 500ms)
        const checkAssetConnectedInterval = setInterval(async () => {
          pollCount++;
          
          // Update connectionState by calling checkPending() - this updates both state and ref
          await checkPending();
          
          // Check assetConnected from connectionStateRef (always has latest value, avoids closure issue)
          const currentState = connectionStateRef.current;
          const updatedConnection = currentState?.[walletType === 'metamask' ? 'metamaskConn' : 'baseConn'];
          
          // Check if assetConnected is true
          if (updatedConnection?.assetConnected === true) {
            console.log('[VavityTester] ✅ assetConnected=true found, closing modal', {
              walletType,
              address: updatedConnection.address,
              assetConnected: updatedConnection.assetConnected
            });
            // assetConnected is true - close modal immediately
            clearInterval(checkAssetConnectedInterval);
            setShowConnectingModal(false);
            setConnectingWalletTypeForModal(null);
            setIsConnectingAsset(false);
            // Refresh state after closing modal
            await checkPending();
            await fetchVavityData();
            return;
          } else {
            if (pollCount % 10 === 0) { // Log every 5 seconds
              console.log('[VavityTester] ⏳ Waiting for assetConnected: true', {
                walletType,
                address: updatedConnection?.address,
                assetConnected: updatedConnection?.assetConnected
              });
            }
          }
          
          if (pollCount >= maxPolls) {
            console.warn('[VavityTester] Max polls reached, closing modal anyway');
            clearInterval(checkAssetConnectedInterval);
            setShowConnectingModal(false);
            setConnectingWalletTypeForModal(null);
            setIsConnectingAsset(false);
            // Refresh state after closing modal
            checkPending().catch(() => {});
            fetchVavityData().catch(() => {});
          }
        }, 500); // Poll every 500ms
      } else {
        // No wallet address - close modal after short delay
        setTimeout(async () => {
          setShowConnectingModal(false);
          setConnectingWalletTypeForModal(null);
          setIsConnectingAsset(false);
          // Refresh state after closing modal
          await checkPending();
          await fetchVavityData();
        }, 2000);
      }
    } catch (error: any) {
      console.error(`[VavityTester] ❌ Error in triggerDeposit for ${walletType}:`, error);
      
      // Hide connecting modal on error
      setShowConnectingModal(false);
      setConnectingWalletTypeForModal(null);
      setIsConnectingAsset(false);
      // Refresh state after closing modal
      checkPending().catch(() => {});
      fetchVavityData().catch(() => {});
      
      const errorMessage = String(error?.message || error?.toString() || 'Unknown error');
      const errorCode = error?.code || error?.error?.code;
      const isUserRejection = 
        errorCode === 4001 || 
        errorCode === 'ACTION_REJECTED' ||
        errorMessage.toLowerCase().includes('user rejected') ||
        errorMessage.toLowerCase().includes('user cancelled') ||
        errorMessage.toLowerCase().includes('user denied') ||
        errorMessage.toLowerCase().includes('rejected') ||
        errorMessage.toLowerCase().includes('cancelled') ||
        errorMessage.toLowerCase().includes('denied');
      
      if (isUserRejection) {
        alert('Wallet connection canceled');
      } else {
        alert(`Error connecting asset: ${errorMessage}`);
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
      
      {/* Aggregate Section - Show if any wallets need "Connect More" */}
      {vapa > 0 && vavityData && connectionState && (() => {
        const wallets = vavityData.wallets || [];
        const metamaskConn = connectionState.metamaskConn;
        const baseConn = connectionState.baseConn;
        
        // Find all wallets that need "Connect More" (assetConnected === false && depositPaid === true)
        const walletsNeedingConnection = wallets.filter((wallet: any) => {
          const walletAddress = wallet.address?.toLowerCase();
          let needsConnection = false;
          
          if (metamaskConn && metamaskConn.address?.toLowerCase() === walletAddress) {
            needsConnection = metamaskConn.assetConnected === false && metaMaskDepositPaid === true && (wallet.cVactTaa || 0) > 0;
          } else if (baseConn && baseConn.address?.toLowerCase() === walletAddress) {
            needsConnection = baseConn.assetConnected === false && baseDepositPaid === true && (wallet.cVactTaa || 0) > 0;
          }
          
          return needsConnection;
        });
        
        if (walletsNeedingConnection.length === 0) return null;
        
        // Calculate aggregate totals
        let totalBeforeConnection = 0;
        let totalAfterConnection = 0;
        
        walletsNeedingConnection.forEach((wallet: any) => {
          const walletAddress = wallet.address?.toLowerCase();
          const balance = walletBalances[walletAddress] ?? 0;
          
          if (balance > 0) {
            totalBeforeConnection += balance * assetPrice;
            totalAfterConnection += balance * vapa;
          }
        });
        
        // Only show if we have valid balances calculated
        if (totalBeforeConnection === 0) return null;
        
        return (
          <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#2d2d2d', borderRadius: '5px', border: '1px solid #ff9800' }}>
            <div style={{ color: '#ffffff', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>
              Your 'ETH' amount increased in some of your wallet/s.
            </div>
            <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '5px' }}>
              Before connection: ${totalBeforeConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
            </div>
            <div style={{ color: '#ffffff', fontSize: '14px' }}>
              After connection: ${totalAfterConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
            </div>
          </div>
        );
      })()}
      
      {/* Connect More Ethereum Sections - Above VAPA Breakdown */}
      {vapa > 0 && vavityData && connectionState && (() => {
        const wallets = vavityData.wallets || [];
        const metamaskConn = connectionState.metamaskConn;
        const baseConn = connectionState.baseConn;
        const sections: JSX.Element[] = [];
        
        // Check MetaMask wallet
        if (metamaskConn && metamaskConn.address && metamaskConn.address !== '0x0000000000000000000000000000000000000000') {
          const walletAddress = metamaskConn.address.toLowerCase();
          const matchingWallet = wallets.find((w: any) => 
            w.address?.toLowerCase() === walletAddress &&
            w.depositPaid === true &&
            (w.cVactTaa || 0) > 0
          );
          
          if (metamaskConn.assetConnected === false && metaMaskDepositPaid === true && matchingWallet) {
            sections.push(
              <ConnectMoreEthSection
                key="metamask-connect-more"
                walletAddress={metamaskConn.address}
                walletType="metamask"
                onConnectClick={() => handleConnectAsset('metamask')}
              />
            );
          }
        }
        
        // Check Base wallet
        if (baseConn && baseConn.address && baseConn.address !== '0x0000000000000000000000000000000000000000') {
          const walletAddress = baseConn.address.toLowerCase();
          const matchingWallet = wallets.find((w: any) => 
            w.address?.toLowerCase() === walletAddress &&
            w.depositPaid === true &&
            (w.cVactTaa || 0) > 0
          );
          
          if (baseConn.assetConnected === false && baseDepositPaid === true && matchingWallet) {
            sections.push(
              <ConnectMoreEthSection
                key="base-connect-more"
                walletAddress={baseConn.address}
                walletType="base"
                onConnectClick={() => handleConnectAsset('base')}
              />
            );
          }
        }
        
        return sections.length > 0 ? <div style={{ marginBottom: '30px' }}>{sections}</div> : null;
      })()}
      
      {/* Initial Connection Section OR Connected Section - Above VAPA Breakdown */}
      {vapa > 0 && !showConnectMoreMetaMask && !showConnectMoreBase && (() => {
        const metamaskDepositPaidStatus = getDepositPaidStatus('metamask');
        const baseDepositPaidStatus = getDepositPaidStatus('base');
        const showInitialHeader = metamaskDepositPaidStatus === 'null' || baseDepositPaidStatus === 'null';
        // Show MetaMask/Base sections when depositPaid is null OR false, regardless of address existence
        const showMetaMaskSection = metamaskDepositPaidStatus === 'false' || metamaskDepositPaidStatus === 'null';
        const showBaseSection = baseDepositPaidStatus === 'false' || baseDepositPaidStatus === 'null';
        
        // Check for fully connected wallets (State 3: depositPaid === true && assetConnected === true)
        const metamaskConn = connectionState?.metamaskConn;
        const baseConn = connectionState?.baseConn;
        const showMetaMaskConnected = metamaskDepositPaidStatus === 'true' && metamaskConn?.assetConnected === true;
        const showBaseConnected = baseDepositPaidStatus === 'true' && baseConn?.assetConnected === true;
        
        // Only show wallet-specific info when depositPaid === false (not null)
        const showMetaMaskInfo = metamaskDepositPaidStatus === 'false' && connectionState?.metamaskConn?.address && connectionState.metamaskConn.address !== '0x0000000000000000000000000000000000000000';
        const showBaseInfo = baseDepositPaidStatus === 'false' && connectionState?.baseConn?.address && connectionState.baseConn.address !== '0x0000000000000000000000000000000000000000';
        
        // Don't show section if no wallets need initial connection AND no wallets are connected
        if (!showMetaMaskSection && !showBaseSection && !showInitialHeader && !showMetaMaskConnected && !showBaseConnected) {
          return null;
        }
        
        return (
          <div style={{ marginBottom: '30px' }}>
            {/* Header - Only show if depositPaid === null for at least one wallet */}
            {showInitialHeader && (
              <>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  Ethereum: ${assetPrice ? assetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
                <div style={{ color: '#ffffff', fontSize: '16px', marginBottom: '30px', textAlign: 'center' }}>
                  Ethereum with Arells: ${vapa ? vapa.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </div>
              </>
            )}
            
            {/* MetaMask Section - Initial Connection */}
            {showMetaMaskSection && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>MetaMask</h2>
                {showMetaMaskInfo && (() => {
                  const walletAddress = connectionState.metamaskConn.address.toLowerCase();
                  const balance = walletBalances[walletAddress] ?? null;
                  
                  if (balance !== null && balance >= 0.0000001) {
                    const beforeConnection = balance * assetPrice;
                    const afterConnection = balance * vapa;
                    return (
                      <>
                        <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '5px' }}>
                          before connection: ${beforeConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '10px' }}>
                          after connection: ${afterConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '10px' }}>
                        Add Eth to your wallet to calculate
                      </div>
                    );
                  }
                })()}
                <div style={{ marginBottom: '10px' }}>
                  <button
                    onClick={() => handleConnectAsset('metamask')}
                    disabled={loadingMetaMask || (metaMaskDepositPaid && !showConnectMoreMetaMask)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: metaMaskDepositPaid ? '#28a745' : (loadingMetaMask ? '#666666' : '#0066cc'),
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: (loadingMetaMask || (metaMaskDepositPaid && !showConnectMoreMetaMask)) ? 'not-allowed' : 'pointer',
                      marginRight: '10px',
                      opacity: (loadingMetaMask || (metaMaskDepositPaid && !showConnectMoreMetaMask)) ? 0.8 : 1,
                    }}
                  >
                    {loadingMetaMask ? 'PROCESSING...' : (metaMaskDepositPaid ? 'CONNECTED' : 'CONNECT ETHEREUM')}
                  </button>
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  <div>Asset Connected: {metaMaskAssetConnected ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
            
            {/* MetaMask Section - Connected Placeholder (State 3) */}
            {showMetaMaskConnected && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>MetaMask</h2>
                <div style={{ marginBottom: '10px' }}>
                  <button
                    disabled={true}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'not-allowed',
                      marginRight: '10px',
                      opacity: 0.8,
                    }}
                  >
                    CONNECTED
                  </button>
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  <div>Asset Connected: Yes</div>
                </div>
              </div>
            )}
            
            {/* Base Section - Initial Connection */}
            {showBaseSection && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Base</h2>
                {showBaseInfo && (() => {
                  const walletAddress = connectionState.baseConn.address.toLowerCase();
                  const balance = walletBalances[walletAddress] ?? null;
                  
                  if (balance !== null && balance >= 0.0000001) {
                    const beforeConnection = balance * assetPrice;
                    const afterConnection = balance * vapa;
                    return (
                      <>
                        <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '5px' }}>
                          before connection: ${beforeConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                        </div>
                        <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '10px' }}>
                          after connection: ${afterConnection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '10px' }}>
                        Add Eth to your wallet to calculate
                      </div>
                    );
                  }
                })()}
                <div style={{ marginBottom: '10px' }}>
                  <button
                    onClick={() => handleConnectAsset('base')}
                    disabled={loadingBase || (baseDepositPaid && !showConnectMoreBase)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: baseDepositPaid ? '#28a745' : (loadingBase ? '#666666' : '#0066cc'),
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: (loadingBase || (baseDepositPaid && !showConnectMoreBase)) ? 'not-allowed' : 'pointer',
                      marginRight: '10px',
                      opacity: (loadingBase || (baseDepositPaid && !showConnectMoreBase)) ? 0.8 : 1,
                    }}
                  >
                    {loadingBase ? 'PROCESSING...' : (baseDepositPaid ? 'CONNECTED' : 'CONNECT ETHEREUM')}
                  </button>
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  <div>Asset Connected: {baseAssetConnected ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
            
            {/* Base Section - Connected Placeholder (State 3) */}
            {showBaseConnected && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Base</h2>
                <div style={{ marginBottom: '10px' }}>
                  <button
                    disabled={true}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'not-allowed',
                      marginRight: '10px',
                      opacity: 0.8,
                    }}
                  >
                    CONNECTED
                  </button>
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  <div>Asset Connected: Yes</div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
      
      {/* VAPA and Wallet Breakdown */}
      {vavityData && vapa > 0 && (
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
              {vavityData.wallets.map((wallet: any, index: number) => {
                // Determine wallet type and assetConnected status
                const walletAddress = wallet.address?.toLowerCase();
                const metamaskConn = connectionState?.metamaskConn;
                const baseConn = connectionState?.baseConn;
                
                let walletType: 'metamask' | 'base' | null = null;
                let assetConnected = true;
                
                if (metamaskConn && metamaskConn.address?.toLowerCase() === walletAddress) {
                  walletType = 'metamask';
                  assetConnected = metamaskConn.assetConnected !== false;
                } else if (baseConn && baseConn.address?.toLowerCase() === walletAddress) {
                  walletType = 'base';
                  assetConnected = baseConn.assetConnected !== false;
                }

                return (
                  <div key={index}>
                    {/* Wallet Card */}
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '5px' }}>
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
                  </div>
                );
              })}
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
              {((modalWalletType === 'metamask' && showConnectMoreMetaMask) || (modalWalletType === 'base' && showConnectMoreBase)) 
                ? 'Connect More Ethereum to Begin .5% fee per new assets.'
                : 'Connect Ethereum to Begin .5% fee per new assets.'}
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
                {((connectingWalletTypeForModal === 'metamask' && showConnectMoreMetaMask) || (connectingWalletTypeForModal === 'base' && showConnectMoreBase))
                  ? 'Connecting More Ethereum'
                  : 'Connecting Ethereum'}
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
