'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import axios from 'axios';

const MASSTester: React.FC = () => {
  const {
    createWallets,
    MASSaddress,
    MASSsupplicationAddress,
    wrappedBitcoinAddress,
    wrappedBitcoinPrivateKey,
    MASSPrivateKey,
    MASSsupplicationPrivateKey,
    balances,
    email,
  } = useSigner();

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const handleConvertToMASSWBTC = async () => {
    if (!wrappedBitcoinAmount || parseFloat(wrappedBitcoinAmount as string) <= 0) {
      setConversionError('Please enter a valid Bitcoin amount.');
      return;
    }

    if (!wrappedBitcoinAddress || !wrappedBitcoinPrivateKey || !MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }

    setConversionError(null);
    setIsConverting(true);

    try {
      const response = await axios.post('/api/MASSapi', {
        bitcoinAmount: parseFloat(wrappedBitcoinAmount as string) * 1e8, // Convert BTC to satoshis
        wrappedBitcoinAddress,
        wrappedBitcoinPrivateKey,
        massAddress: MASSaddress,
      });

      const { wbtcAmount, txId } = response.data;
      setConversionResult(`Conversion successful! Received ${wbtcAmount} WBTC. Transaction ID: ${txId}`);
    } catch (error: any) {
      console.error('Error converting BTC to WBTC:', error);
      setConversionError(error.response?.data?.error || 'Conversion failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div>
      <h2>MASS Wallet Tester</h2>
      <p>Email: {email}</p>
      <hr />
      <h3>Wrapped Bitcoin Details</h3>
      <p>Wrapped Bitcoin Address: {wrappedBitcoinAddress}</p>
      <p>Wrapped Bitcoin Private Key:</p>
      <pre>{wrappedBitcoinPrivateKey || "Not Available"}</pre>
      <p>Wrapped Bitcoin Balance (ARB): {balances.WBTC_ARB} WBTC</p>
      <h3>Convert Wrapped Bitcoin to MASS Wrapped Bitcoin</h3>
      <div>
        <input
          type="tel"
          id="wrappedBitcoinAmount"
          value={wrappedBitcoinAmount}
          onChange={(e) => setWrappedBitcoinAmount(e.target.value)}
          placeholder="Enter amount in BTC"
        />
        <button onClick={handleConvertToMASSWBTC} disabled={isConverting}>
          {isConverting ? 'Converting...' : 'Convert to WBTC'}
        </button>
      </div>
      {conversionError && <p style={{ color: 'red' }}>{conversionError}</p>}
      {conversionResult && <p style={{ color: 'green' }}>{conversionResult}</p>}

      <hr />
      <button onClick={createWallets}>Create Wallets</button>
      <h3>MASS Wallet</h3>
      <p>MASS Address: {MASSaddress || "Not Available"}</p>
      <p>MASS Private Key:</p>
      <pre>{MASSPrivateKey || "Not Available"}</pre>
      <p>MASS Balance (WBTC/POL): {balances.WBTC_POL} WBTC</p>
      <h3>MASS Supplication Wallet</h3>
      <p>MASS Supplication Address: {MASSsupplicationAddress || "Not Available"}</p>
      <p>MASS Supplication Private Key:</p>
      <pre>{MASSsupplicationPrivateKey || "Not Available"}</pre>
      <p>MASS Supplication Balance (USDC/POL): {balances.USDC_POL} USDC</p>
    </div>
  );
};

export default MASSTester;