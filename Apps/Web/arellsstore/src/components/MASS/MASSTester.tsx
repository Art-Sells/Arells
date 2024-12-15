'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import axios from 'axios';

const MASSTester: React.FC = () => {
  const {
    createWallets,
    MASSaddress,
    MASSsupplicationAddress,
    bitcoinAddress,
    bitcoinPrivateKey,
    MASSPrivateKey,
    MASSsupplicationPrivateKey,
    balances,
    email,
    bitcoinBalance,
  } = useSigner();

  const [bitcoinAmount, setBitcoinAmount] = useState<number | string>('');
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const formatBalance = (balance: number | null) =>
    balance !== null ? balance.toFixed(8) : "Loading...";

  const handleConvertToWBTC = async () => {
    if (!bitcoinAmount || parseFloat(bitcoinAmount as string) <= 0) {
      setConversionError('Please enter a valid Bitcoin amount.');
      return;
    }

    if (!bitcoinAddress || !bitcoinPrivateKey || !MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }

    setConversionError(null);
    setIsConverting(true);

    try {
      const response = await axios.post('/api/MASSapi', {
        bitcoinAmount: parseFloat(bitcoinAmount as string) * 1e8, // Convert BTC to satoshis
        bitcoinAddress,
        bitcoinPrivateKey,
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
      <h3>Bitcoin Details</h3>
      <p>Bitcoin Address: {bitcoinAddress}</p>
      <p>Bitcoin Private Key:</p>
      <pre>{bitcoinPrivateKey || "Not Available"}</pre> {/* Full key displayed securely */}
      <p>Bitcoin Balance: {formatBalance(bitcoinBalance)} BTC</p>
      <h3>Convert BTC to WBTC</h3>
      <div>
        <input
          type="tel"
          id="bitcoinAmount"
          value={bitcoinAmount}
          onChange={(e) => setBitcoinAmount(e.target.value)}
          placeholder="Enter amount in BTC"
        />
        <button onClick={handleConvertToWBTC} disabled={isConverting}>
          {isConverting ? 'Converting...' : 'Convert to WBTC'}
        </button>
      </div>
      {conversionError && <p style={{ color: 'red' }}>{conversionError}</p>}
      {conversionResult && <p style={{ color: 'green' }}>{conversionResult}</p>}

      <hr />
      <button onClick={createWallets}>Create Wallets</button>
      <h3>MASS Wallet Details</h3>
      <p>MASS Address: {MASSaddress || "Not Available"}</p>
      <p>MASS Private Key:</p>
      <pre>{MASSPrivateKey || "Not Available"}</pre> {/* Full decrypted key displayed */}
      <p>MASS Supplication Address: {MASSsupplicationAddress || "Not Available"}</p>
      <p>MASS Supplication Private Key:</p>
      <pre>{MASSsupplicationPrivateKey || "Not Available"}</pre> {/* Full decrypted key displayed */}
      <h3>Balances</h3>
      <p>MASS Balances:</p>
      <p>WBTC: {balances.WBTC}</p>
      <p>POL: {balances.POL_MASS}</p>
      <p>MASS Supplication Balances:</p>
      <p>USDC: {balances.USDC}</p>
      <p>POL: {balances.POL_SUPPLICATION}</p>

    </div>
  );
};

export default MASSTester;