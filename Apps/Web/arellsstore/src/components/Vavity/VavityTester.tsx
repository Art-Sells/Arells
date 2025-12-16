'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useVavity } from '../../context/VavityAggregator';
import { useWalletConnection } from '../../context/WalletConnectionContext';
import { ethers } from 'ethers';
import axios from 'axios';
import { WalletType } from '../../utils/walletConnection';

interface WalletData {
  walletId: string;
  address: string;
  // Private key is NOT stored, only displayed once after creation
  cVatoi: number;
  cpVatoi: number;
  cVact: number;
  cpVact: number;
  cVactTaa: number;
  cdVatoi: number;
}

interface VavityCombinations {
  acVatoi: number;
  acdVatoi: number;
  acVact: number;
  acVactTaa: number;
}

const VavityTester: React.FC = () => {
  const {
    assetPrice,
    vapa,
    email,
    fetchVavityAggregator,
    addVavityAggregator,
    saveVavityAggregator,
  } = useVavity();

  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [vavityCombinations, setVavityCombinations] = useState<VavityCombinations>({
    acVatoi: 0,
    acdVatoi: 0,
    acVact: 0,
    acVactTaa: 0,
  });
  const [localVapa, setLocalVapa] = useState<number>(0);
  const [newlyConnectedWallet, setNewlyConnectedWallet] = useState<{ address: string; balance: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Connect Wallet state
  const [connectedAddress, setConnectedAddress] = useState<string>('');
  
  // Get wallet connection from provider
  const { connectWallet: connectWalletFromProvider, isConnectingMetaMask, isConnectingBase, connectedMetaMask, connectedBase } = useWalletConnection();

  const calculateCombinations = (walletList: WalletData[]): VavityCombinations => {
    return walletList.reduce(
      (acc, wallet) => {
        acc.acVatoi += wallet.cVatoi || 0;
        acc.acVact += wallet.cVact || 0;
        acc.acdVatoi += wallet.cdVatoi || 0;
        acc.acVactTaa += wallet.cVactTaa || 0;
        return acc;
      },
      {
        acVatoi: 0,
        acVact: 0,
        acdVatoi: 0,
        acVactTaa: 0,
      }
    );
  };

  const calculateVapa = (walletList: WalletData[]): number => {
    if (walletList.length === 0) return assetPrice || 0;
    const maxCpVact = Math.max(...walletList.map(w => w.cpVact || 0));
    return Math.max(maxCpVact, assetPrice || 0);
  };

  // Sync wallet balances from blockchain
  const syncWalletBalances = useCallback(async () => {
    if (wallets.length === 0 || !email) {
      console.log('[Sync] Skipping - no wallets or email');
      return;
    }

    console.log('[Sync] Starting balance sync for', wallets.length, 'wallets');

    try {
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            // Fetch balance from blockchain
                   const res = await fetch(`/api/ethBalance?address=${wallet.address}`);
            if (!res.ok) {
              console.error(`[Sync] Failed to fetch balance for ${wallet.address}:`, res.status);
              return wallet;
            }
                   const balanceData = await res.json();
                   const balanceInBTC = parseFloat(balanceData.balance);
            
                   console.log(`[Sync] Wallet ${wallet.address}: ${balanceInBTC} BTC`);

            const currentVapa = Math.max(vapa || 0, assetPrice || 0, localVapa || 0);
            const previousCVactTaa = wallet.cVactTaa || 0;
            const newCVactTaa = balanceInBTC;

            // If balance changed from 0 to a value, initialize cpVatoi and cpVact
            if (previousCVactTaa === 0 && newCVactTaa > 0) {
              // First time assets detected - set cpVatoi and cpVact to current VAPA
              const newCpVatoi = currentVapa;
              const newCpVact = currentVapa;
              const newCVact = newCVactTaa * newCpVact;
              const newCVatoi = newCVact; // cVatoi equals cVact at connect time
              const newCdVatoi = newCVact - newCVatoi; // Should be 0 at connect

              return {
                ...wallet,
                cVactTaa: newCVactTaa,
                cpVatoi: newCpVatoi,
                cpVact: newCpVact,
                cVact: newCVact,
                cVatoi: newCVatoi,
                cdVatoi: newCdVatoi,
              };
            } else if (newCVactTaa !== previousCVactTaa) {
              // Balance changed - recalculate values
              const currentCpVact = wallet.cpVact || 0;
              const newCVact = newCVactTaa * currentCpVact;
              const newCdVatoi = newCVact - (wallet.cVatoi || 0);

              return {
                ...wallet,
                cVactTaa: newCVactTaa,
                cVact: newCVact,
                cdVatoi: newCdVatoi,
                // cpVatoi and cVatoi don't change after connect
                cpVatoi: wallet.cpVatoi || 0,
                cVatoi: wallet.cVatoi || 0,
              };
            }

            // No change in balance
            return wallet;
          } catch (error) {
            console.error(`Error fetching balance for wallet ${wallet.address}:`, error);
            return wallet; // Return unchanged wallet on error
          }
        })
      );

      // Check if any wallet was updated
      const hasChanges = updatedWallets.some((w, i) => {
        const old = wallets[i];
        return (w.cVactTaa || 0) !== (old.cVactTaa || 0);
      });

      if (hasChanges) {
        const newCombinations = calculateCombinations(updatedWallets);
        setWallets(updatedWallets);
        setVavityCombinations(newCombinations);
        
        // Save to backend
        await saveVavityAggregator(email, updatedWallets, newCombinations);
      }
    } catch (error) {
      console.error('Error syncing wallet balances:', error);
    }
  }, [wallets, email, vapa, assetPrice, localVapa, saveVavityAggregator]);

  // Fetch existing wallets on mount
  useEffect(() => {
    if (email) {
      loadWallets();
    }
  }, [email]);

  // Sync wallet balances periodically
  useEffect(() => {
    if (wallets.length === 0 || !email) return;

    // Sync immediately after wallets load
    const timeoutId = setTimeout(() => {
      syncWalletBalances();
    }, 2000); // Wait 2 seconds after wallets load

    // Then sync every 30 seconds
    const interval = setInterval(() => {
      syncWalletBalances();
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [wallets.length, email, syncWalletBalances]); // Re-run when wallets are added/removed or email changes

  // Update wallets' cpVact when VAPA increases
  // Only update wallets that have assets (cVactTaa > 0)
  useEffect(() => {
    if (wallets.length === 0 || !email) return;

    const currentVapa = Math.max(vapa || 0, assetPrice || 0, localVapa || 0);
    
    // Check if any wallet with assets (cVactTaa > 0) needs cpVact updating
    const needsUpdate = wallets.some(w => {
      const hasAssets = (w.cVactTaa || 0) > 0;
      const walletCpVact = w.cpVact || 0;
      return hasAssets && walletCpVact < currentVapa;
    });
    
    if (needsUpdate && currentVapa > 0) {
      const updatedWallets = wallets.map(wallet => {
        // Only update wallets that have assets (cVactTaa > 0)
        if ((wallet.cVactTaa || 0) === 0) {
          return wallet; // Keep wallet unchanged if no assets
        }
        
        const newCpVact = Math.max(wallet.cpVact || 0, currentVapa);
        // Recalculate cVact based on new cpVact
        const newCVact = parseFloat(((wallet.cVactTaa || 0) * newCpVact).toFixed(2));
        // Recalculate cdVatoi
        const newCdVatoi = parseFloat((newCVact - (wallet.cVatoi || 0)).toFixed(2));
        
        return {
          ...wallet,
          cpVact: newCpVact,
          cVact: newCVact,
          cdVatoi: newCdVatoi,
        };
      });

      // Calculate new combinations
      const newCombinations = calculateCombinations(updatedWallets);
      const newVapa = Math.max(...updatedWallets.map(w => w.cpVact || 0), currentVapa);

      // Update local state
      setWallets(updatedWallets);
      setVavityCombinations(newCombinations);
      setLocalVapa(newVapa);

      // Save to backend
      saveVavityAggregator(email, updatedWallets, newCombinations).catch(err => {
        console.error('Error saving updated wallets:', err);
      });
    }
  }, [vapa, assetPrice]);

  const loadWallets = async () => {
    try {
      const data = await fetchVavityAggregator(email);
      if (data.wallets) {
        setWallets(data.wallets);
      }
      if (data.vavityCombinations) {
        setVavityCombinations(data.vavityCombinations);
      }
      if (data.vapa) {
        setLocalVapa(data.vapa);
      }
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  };

  // Helper function to connect a wallet (uses provider's centralized connection logic)
  const handleWalletConnection = async (walletType: WalletType) => {
    setError(null);
    setSuccess(null);
    setConnectedAddress(''); // Clear previous address

    try {
      // Use the provider's connectWallet function (handles everything including reload)
      await connectWalletFromProvider(walletType);

      // If we get here, the page should reload, but just in case show success
      setSuccess(`${walletType === 'metamask' ? 'MetaMask' : 'Base'} wallet connected successfully!`);
    } catch (error: any) {
      console.error(`Error connecting ${walletType} wallet:`, error);
      const errorMessage = error?.response?.data?.error || error?.message || `Failed to connect ${walletType === 'metamask' ? 'MetaMask' : 'Base'} wallet. Please try again.`;
      setError(errorMessage);
      setConnectedAddress(''); // Clear address on error
    }
  };

  const handleConnectMetaMask = () => {
    // Prevent execution if already connected or connecting
    const isDisabled = connectedMetaMask || isConnectingMetaMask || isConnectingBase || !email;
    console.log('[MetaMask Button] Clicked. connectedMetaMask:', connectedMetaMask, 'isDisabled:', isDisabled);
    if (isDisabled) {
      console.log('MetaMask button clicked but disabled - ignoring');
      return;
    }
    handleWalletConnection('metamask');
  };

  const handleConnectBase = () => {
    // Prevent execution if already connected or connecting
    const isDisabled = connectedBase || isConnectingMetaMask || isConnectingBase || !email;
    console.log('[Base Button] Clicked. connectedBase:', connectedBase, 'isDisabled:', isDisabled);
    if (isDisabled) {
      console.log('Base button clicked but disabled - ignoring');
      return;
    }
    handleWalletConnection('base');
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    const roundedValue = Math.max(0, value);
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatPrice = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    const roundedValue = Math.max(0, value);
    return roundedValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00000000';
    }
    return value.toFixed(8);
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Vavity Tester</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <p><strong>Email:</strong> {email || 'Not signed in'}</p>
        </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={handleConnectMetaMask}
                disabled={connectedMetaMask || isConnectingMetaMask || isConnectingBase || !email}
                style={{
                  padding: '15px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: connectedMetaMask ? '#28a745' : (email && !isConnectingMetaMask && !isConnectingBase && !connectedMetaMask) ? '#f6851b' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: (connectedMetaMask || isConnectingMetaMask || isConnectingBase || !email) ? 'not-allowed' : 'pointer',
                  opacity: (connectedMetaMask || isConnectingMetaMask || isConnectingBase || !email) ? (connectedMetaMask ? 1 : 0.6) : 1,
                  pointerEvents: (connectedMetaMask || isConnectingMetaMask || isConnectingBase || !email) ? 'none' : 'auto',
                }}
              >
                {connectedMetaMask ? 'CONNECTED TO METAMASK' : (isConnectingMetaMask ? 'CONNECTING METAMASK...' : 'CONNECT METAMASK')}
              </button>
          <button
                onClick={handleConnectBase}
                disabled={connectedBase || isConnectingMetaMask || isConnectingBase || !email}
          style={{
                  padding: '15px 20px',
            fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: connectedBase ? '#28a745' : (email && !isConnectingMetaMask && !isConnectingBase && !connectedBase) ? '#0052ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
                  cursor: (connectedBase || isConnectingMetaMask || isConnectingBase || !email) ? 'not-allowed' : 'pointer',
                  opacity: (connectedBase || isConnectingMetaMask || isConnectingBase || !email) ? (connectedBase ? 1 : 0.6) : 1,
                  pointerEvents: (connectedBase || isConnectingMetaMask || isConnectingBase || !email) ? 'none' : 'auto',
          }}
        >
                {connectedBase ? 'CONNECTED TO BASE' : (isConnectingBase ? 'CONNECTING BASE...' : 'CONNECT BASE')}
        </button>
            </div>
            {connectedAddress && !isConnectingMetaMask && !isConnectingBase && (
              <div style={{
                padding: '10px',
                marginTop: '10px',
                backgroundColor: '#fff3cd',
                borderRadius: '5px',
                fontSize: '12px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                textAlign: 'center',
                border: '1px solid #ffc107',
              }}>
                <strong>Note:</strong> This is an Ethereum address (0x...) from {connectedAddress.startsWith('0x') ? 'MetaMask/Base wallet' : 'wallet'}.<br/>
                Connected: {connectedAddress}
              </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              <p>Status: MetaMask={String(isConnectingMetaMask)}, Base={String(isConnectingBase)}, email={email ? '✓' : '✗'}</p>
              <p>Connected: MetaMask={String(connectedMetaMask)}, Base={String(connectedBase)}</p>
              <p>Buttons enabled: {(!isConnectingMetaMask && !isConnectingBase && email && !connectedMetaMask && !connectedBase) ? 'YES' : 'NO'}</p>
            </div>
          </div>
        {error && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb',
            borderRadius: '5px',
          }}>
            {success}
          </div>
        )}
      </div>

      {newlyConnectedWallet && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#d4edda',
          border: '1px solid #28a745',
          borderRadius: '5px',
        }}>
          <h3>✅ Wallet Connected Successfully!</h3>
          <p><strong>Address:</strong> {newlyConnectedWallet.address}</p>
                <p><strong>Balance:</strong> {newlyConnectedWallet.balance.toFixed(6)} BTC</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Your wallet balance has been added to VavityAggregator.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>External Ethereum Price: ${formatPrice(assetPrice || 0)}</h2>
        <h3>Internal Ethereum Price (VAPA): ${formatPrice(Math.max(vapa || 0, localVapa || 0, assetPrice || 0))}</h3>
      </div>

      {wallets.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>Wallets:</h2>
          {wallets.map((wallet, index) => (
            <div key={wallet.walletId} style={{
              marginBottom: '20px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '5px',
            }}>
              <h3>Wallet ID {index + 1}:</h3>
              <p><strong>Address:</strong> {wallet.address}</p>
              <p>cVatoi = ${formatCurrency(wallet.cVatoi)}, cpVatoi = ${formatPrice(wallet.cpVatoi)}, cVact = ${formatCurrency(wallet.cVact)}, cpVact = ${formatPrice(wallet.cpVact)}.</p>
              <p>cVactTaa = {formatNumber(wallet.cVactTaa)}, cdVatoi = ${formatCurrency(wallet.cdVatoi)}.</p>
            </div>
          ))}
        </div>
      )}

      {wallets.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
        }}>
          <h2>Wallet Totals:</h2>
          <p>acVatoi = ${formatCurrency(vavityCombinations.acVatoi)} ({wallets.map(w => `$${formatCurrency(w.cVatoi)}`).join(' + ')})</p>
          <p>acdVatoi = ${formatCurrency(vavityCombinations.acdVatoi)} ({wallets.map(w => `$${formatCurrency(w.cdVatoi)}`).join(' + ')})</p>
          <p>acVact = ${formatCurrency(vavityCombinations.acVact)} ({wallets.map(w => `$${formatCurrency(w.cVact)}`).join(' + ')})</p>
          <p>acVactTaa = {formatNumber(vavityCombinations.acVactTaa)} ({wallets.map(w => formatNumber(w.cVactTaa)).join(' + ')})</p>
        </div>
      )}

      {wallets.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>No wallets connected yet. Click "Connect Wallet" to connect your MetaMask or Base wallet.</p>
        </div>
      )}
    </div>
  );
};

export default VavityTester;
