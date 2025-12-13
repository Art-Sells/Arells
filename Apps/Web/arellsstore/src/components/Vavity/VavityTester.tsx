'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useVavity } from '../../context/VavityAggregator';
import { useSigner } from '../../state/signer';
import { BitcoinWallet } from '../../lib/bitcoin-wallet';
import axios from 'axios';

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
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Connect Wallet state
  const [connectWalletAddress, setConnectWalletAddress] = useState<string>('');

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
            const res = await fetch(`/api/balance?address=${wallet.address}`);
            if (!res.ok) {
              console.error(`[Sync] Failed to fetch balance for ${wallet.address}:`, res.status);
              return wallet;
            }
            const balanceInSatoshis = await res.json();
            const balanceInBTC = balanceInSatoshis / 100000000; // Convert satoshis to BTC
            
            console.log(`[Sync] Wallet ${wallet.address}: ${balanceInBTC} BTC (${balanceInSatoshis} satoshis)`);

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

  const handleConnectWallet = async () => {
    setError(null);
    setSuccess(null);
    
    if (!email) {
      setError('Email is required to connect a wallet. Please sign in first.');
      return;
    }

    if (!connectWalletAddress.trim()) {
      setError('Wallet address is required.');
      return;
    }

    setIsConnecting(true);
    try {
      console.log('Connecting wallet for email:', email, 'Address:', connectWalletAddress);
      
      // Fetch balance from blockchain
      const balanceResponse = await fetch(`/api/balance?address=${connectWalletAddress.trim()}`);
      if (!balanceResponse.ok) {
        throw new Error('Failed to fetch wallet balance');
      }
      const balanceInSatoshis = await balanceResponse.json();
      const balanceInBTC = balanceInSatoshis / 100000000; // Convert satoshis to BTC
      
      if (balanceInBTC <= 0) {
        setError('This wallet has no balance. Please connect a wallet with Bitcoin.');
        setIsConnecting(false);
        return;
      }

      // Get current asset price for calculations
      const currentVapa = Math.max(vapa || 0, assetPrice || 0, localVapa || 0);
      const currentAssetPrice = assetPrice || currentVapa;
      
      // Initialize wallet data with fetched balance
      const walletId = `connected-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newCVactTaa = balanceInBTC;
      const newCpVact = currentVapa;
      const newCVact = newCVactTaa * newCpVact;
      const newCVatoi = newCVact; // cVatoi equals cVact at connect time
      const newCpVatoi = currentAssetPrice; // Price at connect time
      const newCdVatoi = newCVact - newCVatoi; // Should be 0 at connect
      
      const walletData: WalletData = {
        walletId: walletId,
        address: connectWalletAddress.trim(),
        cVatoi: newCVatoi,
        cpVatoi: newCpVatoi,
        cVact: newCVact,
        cpVact: newCpVact,
        cVactTaa: newCVactTaa,
        cdVatoi: newCdVatoi,
      };

      // Add the connected wallet to the list
      const updatedWallets = [...wallets, walletData];
      
      // Calculate new combinations
      const newCombinations = calculateCombinations(updatedWallets);
      const newVapa = calculateVapa(updatedWallets);

      // Save to API
      await addVavityAggregator(email, [walletData]);

      // Update local state
      setWallets(updatedWallets);
      setVavityCombinations(newCombinations);
      setLocalVapa(newVapa);
      
      // Show the connected wallet info
      setNewlyConnectedWallet({ address: connectWalletAddress.trim(), balance: balanceInBTC });
      setSuccess(`Wallet connected successfully! Balance: ${balanceInBTC.toFixed(8)} BTC`);
      
      // Clear the input
      setConnectWalletAddress('');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to connect wallet. Please try again.';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
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
            <input
              type="text"
              value={connectWalletAddress}
              onChange={(e) => setConnectWalletAddress(e.target.value)}
              placeholder="Enter Bitcoin wallet address"
              style={{
                padding: '10px',
                fontSize: '14px',
                width: '400px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontFamily: 'monospace',
                marginRight: '10px',
              }}
              disabled={isConnecting}
            />
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting || !email || !connectWalletAddress.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: (email && connectWalletAddress.trim()) ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (isConnecting || !email || !connectWalletAddress.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {isConnecting ? 'Connecting Wallet...' : 'Connect Wallet'}
            </button>
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
          <p><strong>Balance:</strong> {newlyConnectedWallet.balance.toFixed(8)} BTC</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Your wallet balance has been added to VavityAggregator.
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>External Bitcoin Price: ${formatPrice(assetPrice || 0)}</h2>
        <h3>Internal Bitcoin Price (VAPA): ${formatPrice(Math.max(vapa || 0, localVapa || 0, assetPrice || 0))}</h3>
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
          <p>No wallets connected yet. Enter a wallet address and click "Connect Wallet" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default VavityTester;
