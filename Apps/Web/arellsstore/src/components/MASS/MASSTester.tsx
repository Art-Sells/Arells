'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import axios from 'axios';

const MASSTester: React.FC = () => {
  const {
    createWallets,
    MASSaddress,
    MASSsupplicationAddress,
    MASSPrivateKey,
    MASSsupplicationPrivateKey,
    balances,
    email,
  } = useSigner();

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [swapCostResult, setSwapCostResult] = useState<string | null>(null);
  const [isCheckingCost, setIsCheckingCost] = useState<boolean>(false);

  // const handleCheckSwapCost = async () => {
  //   if (!wrappedBitcoinAmount || parseFloat(wrappedBitcoinAmount as string) <= 0) {
  //     alert('Please enter a valid Bitcoin amount.');
  //     return;
  //   }

  //   setIsCheckingCost(true);
  //   setSwapCostResult(null);

  //   try {
  //     const response = await axios.post('/api/checkSwapCost', {
  //       wrappedBitcoinAmount,
  //     });

  //     const { gasPrice, gasLimit, gasCostInEth } = response.data;

  //     setSwapCostResult(`Gas Price: ${gasPrice} GWEI\nGas Limit: ${gasLimit}\nEstimated Cost: ${gasCostInEth} ETH`);
  //   } catch (error: any) {
  //     console.error('Error checking swap cost:', error);
  //     setSwapCostResult('Failed to check swap cost. Please try again.');
  //   } finally {
  //     setIsCheckingCost(false);
  //   }
  // };

  const handleWBTCsupplication = async () => {
    if (!wrappedBitcoinAmount || parseFloat(wrappedBitcoinAmount as string) <= 0) {
      setConversionError('Please enter a valid Bitcoin amount.');
      return;
    }
  
    if (!MASSaddress || !MASSsupplicationAddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
  
    setConversionError(null);
    setIsConverting(true);
  
    try {
      const response = await axios.post('/api/MASSapi', {
        wrappedBitcoinAmount: parseFloat(wrappedBitcoinAmount as string) * 1e8, // Convert BTC to satoshis
        massAddress: MASSaddress, // Fix case sensitivity
        massPrivateKey: MASSPrivateKey, // Fix parameter name
        massSupplicationAddress: MASSsupplicationAddress,
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
  const handleUSDCsupplication = async () => {
    if (!dollarAmount || isNaN(Number(dollarAmount)) || Number(dollarAmount) <= 0) {
      setConversionError('Please enter a valid USDC amount.');
      return;
    }
  
    if (!MASSsupplicationAddress || !MASSsupplicationPrivateKey || !MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
  
    setIsConverting(true);
    setConversionError(null);
  
    try {
      const response = await axios.post('/api/MASSsupplicationApi', {
        usdcAmount: Math.floor(Number(dollarAmount) * 1e6), // Convert USD to base units (6 decimals)
        massSupplicationAddress: MASSsupplicationAddress,
        massSupplicationPrivateKey: MASSsupplicationPrivateKey,
        massAddress: MASSaddress,
      });
  
      const { receivedAmount, txId } = response.data;
      setConversionResult(`Supplication successful! Received ${receivedAmount} WBTC. Transaction ID: ${txId}`);
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
      <h3>MASS Wallet Address</h3>
      <p>{MASSaddress || 'Not Available'}</p>
      <p>MASS Private Key:</p>
      <pre>{MASSPrivateKey || 'Not Available'}</pre>
      <p>MASS Balance (BTC/BASE): {balances.BTC_BASE} BTC</p>
      <div>
        <input
          type="tel"
          id="wrappedBitcoinAmount"
          value={wrappedBitcoinAmount}
          onChange={(e) => setWrappedBitcoinAmount(e.target.value)}
          placeholder="Enter amount in WBTC"
        />
        <button onClick={handleWBTCsupplication} disabled={isConverting}>
          {isConverting ? 'Supplicating...' : 'Supplicate WBTC to USD'}
        </button>
        {conversionError && <p style={{ color: 'red' }}>{conversionError}</p>}
        {conversionResult && <p style={{ color: 'green' }}>{conversionResult}</p>}
      </div>
      <hr />
      <h3>MASS Supplication Wallet Address</h3>
      <p>{MASSsupplicationAddress || 'Not Available'}</p>
      <p>MASS Supplication Private Key:</p>
      <pre>{MASSsupplicationPrivateKey || 'Not Available'}</pre>
      <p>MASS Supplication Balance (USDC/BASE): {balances.USDC_BASE} USDC</p>
      <div>
        <input
          type="tel"
          id="dollarAmount"
          value={dollarAmount}
          onChange={(e) => setDollarAmount(e.target.value)}
          placeholder="Enter amount in USD (USDC)"
        />
        <button onClick={handleUSDCsupplication} disabled={isConverting}>
          {isConverting ? 'Supplicating...' : 'Supplicate USDC to WBTC'}
        </button>
      </div>
      {conversionError && <p style={{ color: 'red' }}>{conversionError}</p>}
      {conversionResult && <p style={{ color: 'green' }}>{conversionResult}</p>}
      <hr />
      {/* <div>
        <h2>Check Swap Cost</h2>
        <input
          type="number"
          value={wrappedBitcoinAmount}
          onChange={(e) => setWrappedBitcoinAmount(e.target.value)}
          placeholder="Enter WBTC Amount"
        />
        <button onClick={handleCheckSwapCost} disabled={isCheckingCost}>
          {isCheckingCost ? 'Checking...' : 'Check Swap Cost'}
        </button>
        {swapCostResult && (
          <pre style={{ marginTop: '10px', whiteSpace: 'pre-wrap', color: 'green' }}>
            {swapCostResult}
          </pre>
        )}
      </div> */}
      <hr />
      <button onClick={createWallets}>Create Wallets</button>
    </div>
  );
};

export default MASSTester;