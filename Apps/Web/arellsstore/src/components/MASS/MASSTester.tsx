// components/MASSTester.tsx
'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer';
import axios from 'axios';

const MASSTester: React.FC = () => {
  const {
    // NEW: pull these from the signer context
    userAddress,
    userPrivateKey,
    createMASSWallets,
    MASSaddress,
    MASSPrivateKey,
    balances,
    email,
  } = useSigner();

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isUserPkVisible, setIsUserPkVisible] = useState<boolean>(false); // optional toggle

  const handleUSDCInputChange = (val: string) => setDollarAmount(val);

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
      const response = await axios.post('/api/MASS_cbbtc', {
        cbBitcoinAmount: parseFloat(wrappedBitcoinAmount as string),
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
      setConversionResult('Supplication successful!');
    } catch (error: any) {
      console.error('Error supplicating CBBTC to USDC:', error);
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
      const response = await axios.post('/api/MASS_usdc', {
        usdcAmount: parseFloat(dollarAmount as string),
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
      setConversionResult('Supplication successful!');
    } catch (error: any) {
      console.error('Error during USDC supplication:', error.response?.data || error.message);
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

      {/* USER WALLET */}
      <div>
        <h3>User Wallet Address</h3>
        <p>{userAddress || 'Not Available'}</p>

        <p style={{ marginTop: 12, marginBottom: 4 }}>User Private Key:</p>
        <div style={{ background: '#111', color: '#0f0', padding: 10, borderRadius: 6, maxWidth: 600 }}>
          {isUserPkVisible ? (userPrivateKey || 'Not Available') : '••••••••••••••••••••'}
        </div>
        <button style={{ marginTop: 8 }} onClick={() => setIsUserPkVisible((v) => !v)}>
          {isUserPkVisible ? 'Hide' : 'Show'} Private Key
        </button>

        <hr style={{ margin: '18px 0' }} />

        <p>Balance (USDC/BASE): {balances.USDC_BASE} USDC</p>
        <div>
          <label>USDC Amount:</label>
          <input
            type="text"
            id="usdcAmount"
            value={dollarAmount}
            onChange={(e) => handleUSDCInputChange(e.target.value)}
            placeholder="Enter amount in USDC"
          />
        </div>
      </div>

      <hr />
      <button onClick={createMASSWallets}>Create MASS Wallet</button>
      <hr />

      {/* MASS WALLET */}
      <h3>MASS Wallet Address</h3>
      <p>{MASSaddress || 'Not Available'}</p>
      <p>MASS Private Key:</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{MASSPrivateKey || 'Not Available'}</pre>

      <h4>Balances</h4>
      <p>BTC/BASE: {balances.BTC_BASE} BTC</p>

      <div>
        <input
          type="tel"
          id="wrappedBitcoinAmount"
          value={wrappedBitcoinAmount}
          onChange={(e) => setWrappedBitcoinAmount(e.target.value)}
          placeholder="Enter amount in BTC"
        />
        <button onClick={handleCBBTCsupplication} disabled={isConverting}>
          {isConverting ? 'Supplicating...' : 'Supplicate CBBTC to USD'}
        </button>
        {conversionError && <p style={{ color: 'red' }}>{conversionError}</p>}
        {conversionResult && <p style={{ color: 'green' }}>{conversionResult}</p>}
      </div>

      <hr />
      <p>USDC/BASE: {balances.USDC_BASE} USDC</p>
      <div>
        <input
          type="tel"
          id="dollarAmount"
          value={dollarAmount}
          onChange={(e) => setDollarAmount(e.target.value)}
          placeholder="Enter amount in USD"
        />
        <button onClick={handleUSDCsupplication} disabled={isConverting}>
          {isConverting ? 'Supplicating...' : 'Supplicate USDC to CBBTC'}
        </button>
      </div>

      {conversionError && <p style={{ color: 'red' }}>{conversionError}</p>}
      {conversionResult && <p style={{ color: 'green' }}>{conversionResult}</p>}
    </div>
  );
};

export default MASSTester;