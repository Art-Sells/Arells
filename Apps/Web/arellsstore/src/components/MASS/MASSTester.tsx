// components/MASSTester.tsx
'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer';
import axios from 'axios';

const MASSTester: React.FC = () => {
  const {
    createMASSWallets,
    MASSaddress,
    MASSPrivateKey,
    userAddress,
    userPrivateKey,
    balances,
    email,
    // (optional) loadBalances if you want to refresh after creation
    loadBalances,
  } = useSigner();

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // NEW: creation state
  const [isCreatingMASS, setIsCreatingMASS] = useState(false);
  const [createMASSError, setCreateMASSError] = useState<string | null>(null);

  const handleCreateMASS = async () => {
    setIsCreatingMASS(true);
    setCreateMASSError(null);
    try {
      await createMASSWallets();
      // optionally refresh balances after creating
      if (typeof loadBalances === 'function') {
        await loadBalances();
      }
    } catch (e: any) {
      setCreateMASSError(e?.message || 'Failed to create MASS wallet');
    } finally {
      setIsCreatingMASS(false);
    }
  };

  const handleCBBTCsupplication = async () => {
    if (!wrappedBitcoinAmount || parseFloat(wrappedBitcoinAmount as string) <= 0) {
      setConversionError('Please enter a valid Bitcoin amount.');
      return;
    }
    if (!MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
    setConversionError(null);
    setIsConverting(true);
    try {
      await axios.post('/api/MASS_cbbtc', {
        cbBitcoinAmount: parseFloat(wrappedBitcoinAmount as string),
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
      setConversionResult('Supplication successful!');
    } catch (error: any) {
      setConversionError(error.response?.data?.error || 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleUSDCsupplication = async () => {
    if (!dollarAmount || isNaN(Number(dollarAmount)) || Number(dollarAmount) <= 0) {
      setConversionError('Please enter a valid USDC amount.');
      return;
    }
    if (!MASSPrivateKey || !MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
    setIsConverting(true);
    setConversionError(null);
    try {
      await axios.post('/api/MASS_usdc', {
        usdcAmount: parseFloat(dollarAmount as string),
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
      setConversionResult('Supplication successful!');
    } catch {
      setConversionError('Supplication failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <h2>MASS Wallet Tester</h2>
      <p>Email: {email}</p>
      <hr />

      <h3>User Wallet</h3>
      <p>Address: {userAddress || 'Not Available'}</p>
      <p>Private Key: {userPrivateKey || 'Not Available'}</p>
      <hr />

      <h3>MASS Wallet</h3>
      <p>Address: {MASSaddress || 'Not Available'}</p>
      <p>Private Key: {MASSPrivateKey || 'Not Available'}</p>

      <button onClick={handleCreateMASS} disabled={isCreatingMASS}>
        {isCreatingMASS ? 'Creating…' : 'Create MASS Wallet'}
      </button>
      {createMASSError && <p>{createMASSError}</p>}

      <hr />

      <p>Balance (USDC/BASE): {balances.USDC_BASE} USDC</p>
      <p>Balance (BTC/BASE): {balances.BTC_BASE} BTC</p>

      <div>
        <input
          type="tel"
          value={wrappedBitcoinAmount}
          onChange={(e) => setWrappedBitcoinAmount(e.target.value)}
          placeholder="Enter amount in BTC"
        />
        <button onClick={handleCBBTCsupplication} disabled={isConverting}>
          {isConverting ? 'Supplicating...' : 'Supplicate CBBTC to USD'}
        </button>
      </div>

      <div>
        <input
          type="tel"
          value={dollarAmount}
          onChange={(e) => setDollarAmount(e.target.value)}
          placeholder="Enter amount in USD"
        />
        <button onClick={handleUSDCsupplication} disabled={isConverting}>
          {isConverting ? 'Supplicating...' : 'Supplicate USDC to CBBTC'}
        </button>
      </div>

      {conversionError && <p>{conversionError}</p>}
      {conversionResult && <p>{conversionResult}</p>}
    </div>
  );
};

export default MASSTester;