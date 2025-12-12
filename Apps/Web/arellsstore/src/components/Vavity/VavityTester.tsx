'use client';

import React, { useState, useEffect } from 'react';
import { useVavity } from '../../context/VavityAggregator';
import { useSigner } from '../../state/signer';
import { generateBitcoinWallet, BitcoinWallet } from '../../lib/bitcoin-wallet';
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
  const [newlyCreatedWallet, setNewlyCreatedWallet] = useState<BitcoinWallet | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch existing wallets on mount
  useEffect(() => {
    if (email) {
      loadWallets();
    }
  }, [email]);

  // Update wallets' cpVact when VAPA increases
  useEffect(() => {
    if (wallets.length === 0 || !email) return;

    const currentVapa = Math.max(vapa || 0, assetPrice || 0, localVapa || 0);
    
    // Check if any wallet's cpVact needs updating (only if VAPA increased)
    const needsUpdate = wallets.some(w => {
      const walletCpVact = w.cpVact || 0;
      return walletCpVact < currentVapa;
    });
    
    if (needsUpdate && currentVapa > 0) {
      const updatedWallets = wallets.map(wallet => {
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

  const calculateCombinations = (walletList: WalletData[]): VavityCombinations => {
    return walletList.reduce(
      (acc, wallet) => {
        acc.acVatoi += wallet.cVatoi || 0;
        acc.acVacts += wallet.cVact || 0;
        acc.acdVatoi += wallet.cdVatoi || 0;
        acc.acVactTaa += wallet.cVactTaa || 0;
        return acc;
      },
      {
        acVatoi: 0,
        acVacts: 0,
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

  const handleCreateWallet = async () => {
    setError(null);
    setSuccess(null);
    
    if (!email) {
      setError('Email is required to create a wallet. Please sign in first.');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating wallet for email:', email);
      // Generate new Bitcoin wallet
      const newWallet = generateBitcoinWallet();
      
      // Initialize wallet data with default values
      // When a wallet is first created, it has no assets, so values start at 0
      // cpVatoi should be set to VAPA at the time of import (current VAPA)
      const currentVapa = Math.max(vapa || 0, assetPrice || 0);
      const walletData: WalletData = {
        walletId: newWallet.walletId,
        address: newWallet.address,
        cVatoi: 0, // Will be set when assets are imported
        cpVatoi: currentVapa, // Set to VAPA at the time of import (not current asset price)
        cVact: 0, // Starts at 0, increases as assets are imported
        cpVact: currentVapa, // Starts at current VAPA, increases with VAPA
        cVactTaa: 0, // Token amount starts at 0
        cdVatoi: 0, // Difference starts at 0
      };

      // Add the new wallet to the list
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
      
      // Show the private key once (not saved)
      // This will only disappear on page reload
      setNewlyCreatedWallet(newWallet);
      setSuccess('Wallet created successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (error: any) {
      console.error('Error creating wallet:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to create wallet. Please try again.';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
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
        <button
          onClick={handleCreateWallet}
          disabled={isCreating || !email}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: email ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (isCreating || !email) ? 'not-allowed' : 'pointer',
          }}
        >
          {isCreating ? 'Creating Wallet...' : 'Create Wallet'}
        </button>
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

      {newlyCreatedWallet && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '5px',
        }}>
          <h3>⚠️ New Wallet Created - Save Your Private Key!</h3>
          <p><strong>Address:</strong> {newlyCreatedWallet.address}</p>
          <p><strong>Private Key:</strong> {newlyCreatedWallet.privateKey}</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            This private key will not be shown again. Please save it securely.
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
          <p>acVact = ${formatCurrency(vavityCombinations.acVacts)} ({wallets.map(w => `$${formatCurrency(w.cVact)}`).join(' + ')})</p>
          <p>acVactTaa = {formatNumber(vavityCombinations.acVactTaa)} ({wallets.map(w => formatNumber(w.cVactTaa)).join(' + ')})</p>
        </div>
      )}

      {wallets.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>No wallets created yet. Click "Create Wallet" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default VavityTester;
