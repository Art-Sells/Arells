'use client';

import React, { useState } from 'react';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import axios from 'axios';

const MASSTester: React.FC = () => {
  const {
    createWallets,
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
  
    if (!MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }
  
    setConversionError(null);
    setIsConverting(true);
  
    try {
      const response = await axios.post('/api/MASS_cbbtc', {
        cbBitcoinAmount: parseFloat(wrappedBitcoinAmount as string), // Keep as BTC (float with 8 decimals)
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
  
      const { wbtcAmount, txId } = response.data;
      setConversionResult(`Supplication successful! `);
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
        usdcAmount: Math.floor(Number(dollarAmount) * 1e6), // Convert USD to base units (6 decimals)
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      });
  
      const { receivedAmount, txId } = response.data;
      setConversionResult(`Supplication successful!`);
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
        <button onClick={handleWBTCsupplication} disabled={isConverting}>
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