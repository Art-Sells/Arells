'use client';

import React, { useState, useEffect } from 'react';
import { useHPM } from '../../context/HPMarchitecture';
import { useMASS } from '../../context/MASSarchitecture';
import { useSigner } from '../../state/signer'; // Ensure the correct path
import axios from 'axios';

const HPMMASSTester: React.FC = () => {
  const {
    bitcoinPrice,
    vatopGroups,
    vatopCombinations,
    hpap,
    handleBuy,
    handleSell,
    handleImportABTC,
    readABTCFile,
    setManualBitcoinPrice,
    soldAmounts,
  } = useHPM();

  const {
    createWallets,
    MASSaddress,
    MASSsupplicationAddress,
    MASSPrivateKey,
    MASSsupplicationPrivateKey,
    balances,
    email,
  } = useSigner();

  const [inputBuyAmount, setInputBuyAmount] = useState<string>('');
  const [inputSellAmount, setInputSellAmount] = useState<string>('');
  const [inputImportAmount, setInputImportAmount] = useState<string>('');
  const [aBTC, setABTC] = useState<number>(0);
  const { resetSupplicateWBTCtoUSD } = useMASS();

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [supplicationResult, setSupplicationResult] = useState<string | null>(null);
  const [supplicationError, setSupplicationError] = useState<string | null>(null);
  const [isSupplicating, setIsSupplicating] = useState<boolean>(false);
  const [wbtcConversion, setWbtcConversion] = useState<string>('0.00000000');
  const [usdcConversion, setUsdcConversion] = useState<string>('0.00');

  useEffect(() => {
    const fetchABTC = async () => {
      const fetchedABTC = await readABTCFile();
      setABTC(fetchedABTC || 0);
    };
    fetchABTC();
  }, [readABTCFile]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.0000000';
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };

  const handleIncreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 1000);
  };

  const handleDecreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(currentPrice - 1000, 0));
  };

  const handleBuyClick = () => {
    const amount = parseFloat(inputBuyAmount) || 0;
    if (amount > 0) {
      handleBuy(amount);
      setInputBuyAmount('');
    } else {
      alert('Invalid buy amount');
    }
  };

  const handleSellClick = () => {
    const amount = parseFloat(inputSellAmount.replace(/,/g, '').trim()) || 0;
    if (amount > 0) {
      handleSell(amount);
      setInputSellAmount('');
    } else {
      alert('Invalid sell amount');
    }
  };

  const handleImportClick = async () => {
    const amount = parseFloat(inputImportAmount) || 0;
    if (amount > 0) {
      await handleImportABTC(amount);
      setInputImportAmount('');
    } else {
      alert('Invalid import amount');
    }
  };

// Corrected USDC equivalent for a given WBTC amount
const getUSDCEquivalent = (wbtcAmount: number, bitcoinPrice: number): number => {
  return wbtcAmount * bitcoinPrice; // Direct conversion without extra factors
};

// Calculate WBTC equivalent for a given USDC amount
const getWBTCEquivalent = (usdcAmount: number, bitcoinPrice: number): number => {
  if (bitcoinPrice <= 0) {
    throw new Error('Bitcoin price must be greater than zero.');
  }
  return usdcAmount / bitcoinPrice; // Calculate WBTC equivalent
};

const handleUSDCInputChange = (value: string) => {
  setDollarAmount(value); // Update the dollar amount state
  const parsedAmount = parseFloat(value); // Parse the input

  if (!isNaN(parsedAmount) && parsedAmount > 0 && bitcoinPrice > 0) {
    const wbtcEquivalent = getWBTCEquivalent(parsedAmount, bitcoinPrice); // Convert USDC to WBTC
    setWbtcConversion(wbtcEquivalent.toFixed(8)); // Format WBTC value
  } else {
    setWbtcConversion('0.00000000'); // Reset if input is invalid
  }
};

const handleWBTCInputChange = (value: string) => {
  setWrappedBitcoinAmount(value); // Update WBTC input value
  const parsedAmount = parseFloat(value); // Parse the input

  if (!isNaN(parsedAmount) && parsedAmount > 0 && bitcoinPrice > 0) {
    const usdcEquivalent = getUSDCEquivalent(parsedAmount, bitcoinPrice); // Convert WBTC to USDC
    setUsdcConversion(usdcEquivalent.toFixed(2)); // Format USDC value
  } else {
    setUsdcConversion('0.00'); // Reset if input is invalid
  }
};


















const handleWBTCsupplication = async () => {
  const dollarInput = parseFloat(String(dollarAmount)); // User input in dollars

  if (isNaN(dollarInput) || dollarInput <= 0) {
    setSupplicationError('Please enter a valid dollar amount.');
    return;
  }

  if (!MASSaddress || !MASSsupplicationAddress || !MASSPrivateKey) {
    setSupplicationError('Wallet information is missing.');
    return;
  }

  setSupplicationError(null);
  setIsSupplicating(true);

  try {
    // Convert dollars to WBTC equivalent
    const wbtcEquivalent = dollarInput / bitcoinPrice; // WBTC equivalent of dollarInput
    const wbtcInSatoshis = Math.floor(wbtcEquivalent * 1e8); // Convert to satoshis

    if (wbtcInSatoshis <= 0) {
      setSupplicationError('Calculated WBTC amount is too small.');
      return;
    }

    const payload = {
      wrappedBitcoinAmount: wbtcInSatoshis, // Amount in satoshis
      massAddress: MASSaddress,
      massPrivateKey: MASSPrivateKey,
      massSupplicationAddress: MASSsupplicationAddress,
    };

    console.log('🚀 Sending Payload:', payload);

    const response = await axios.post('/api/MASSapi', payload);

    const { receivedAmount, txId } = response.data;
    setSupplicationResult(
      `Supplication successful! Received ${receivedAmount} USDC. Transaction ID: ${txId}`
    );
  } catch (error: any) {
    console.error('❌ API Error:', error.response?.data || error.message);
    setSupplicationError(error.response?.data?.error || 'Supplication failed. Please try again.');
  } finally {
    setIsSupplicating(false);
  }
};

const handleUSDCsupplication = async () => {
  if (!wrappedBitcoinAmount || isNaN(Number(wrappedBitcoinAmount)) || Number(wrappedBitcoinAmount) <= 0) {
    setSupplicationError('Please enter a valid amount.');
    return;
  }

  if (!MASSsupplicationAddress || !MASSsupplicationPrivateKey || !MASSaddress) {
    setSupplicationError('Wallet information is missing.');
    return;
  }

  setSupplicationError(null);
  setIsSupplicating(true);

  try {
    // Calculate USDC equivalent with 6 decimal places
    const usdcEquivalent = getUSDCEquivalent(Number(wrappedBitcoinAmount), bitcoinPrice);
    const usdcInMicroUnits = Math.floor(usdcEquivalent * 1e6); // Convert to base units

    if (usdcInMicroUnits === 0) {
      setSupplicationError('Calculated USDC amount is too small.');
      return;
    }

    const payload = {
      usdcAmount: usdcInMicroUnits,
      massSupplicationAddress: MASSsupplicationAddress,
      massSupplicationPrivateKey: MASSsupplicationPrivateKey,
      massAddress: MASSaddress,
    };

    console.log('🚀 Sending Payload:', payload);

    const response = await axios.post('/api/MASSsupplicationApi', payload);

    const { receivedAmount, txId } = response.data;
    setSupplicationResult(`Supplication successful! Received ${receivedAmount} WBTC. Transaction ID: ${txId}`);
  } catch (error: any) {
    console.error('❌ API Error:', error.response?.data || error.message);
    setSupplicationError(error.response?.data?.error || 'Supplication failed. Please try again.');
  } finally {
    setIsSupplicating(false);
  }
};



















  const handleReset = () => {
    resetSupplicateWBTCtoUSD();
    console.log('SupplicateWBTCtoUSD has been reset for all groups.');
  };

  return (
    <div>
      <h1>HPM and MASS Tester</h1>
      <h2>Wrapped Bitcoin Price</h2>
      <h3>${formatCurrency(bitcoinPrice)}</h3>
      <button onClick={handleIncreasePrice}>Increase Price</button>
      <button onClick={handleDecreasePrice}>Decrease Price</button>

      <div>
        <label>Sell Amount:</label>
        <input
          type="text"
          value={inputSellAmount}
          onChange={(e) => setInputSellAmount(e.target.value)}
        />
        <button onClick={handleSellClick}>Sell</button>
      </div>
      <div>
        <label>Import Amount (BTC):</label>
        <input
          type="text"
          value={inputImportAmount}
          onChange={(e) => setInputImportAmount(e.target.value)}
        />
        <button onClick={handleImportClick}>Import</button>
      </div>

      <div>
        <h2>HPAP:</h2>
        <h3>${formatCurrency(hpap)}</h3>
      </div>
      <div>
        <h2>aBTC:</h2>
        <p>{formatNumber(aBTC)}</p>
      </div>
      <div>
        <h2>Vatop Groups:</h2>
        {vatopGroups.map((group, index) => (
          <div key={index}>
            <h3>Group {index + 1}</h3>
            <p>cVatop: {formatCurrency(group.cVatop)}</p>
            <p>cpVatop: {formatCurrency(group.cpVatop)}</p>
            <p>cVact: {formatCurrency(group.cVact)}</p>
            <p>cpVact: {formatCurrency(group.cpVact)}</p>
            <p>cVactTa: {formatNumber(group.cVactTa)}</p>
            <p>cVactTaa: {formatNumber(group.cVactTaa)}</p>
            <p>cVactDa: {formatCurrency(group.cVactDa)}</p>
            <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
          </div>
        ))}
      </div>
      <div>
        <h2>Vatop Combinations:</h2>
        <p>acVatops: {formatCurrency(vatopCombinations.acVatops)}</p>
        <p>acVacts: {formatCurrency(vatopCombinations.acVacts)}</p>
        <p>acVactTas: {formatNumber(vatopCombinations.acVactTas)}</p>
        <p>acVactDas: {formatCurrency(vatopCombinations.acVactDas)}</p>
        <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
        <p>acVactTaa: {formatNumber(vatopCombinations.acVactTaa)}</p>
      </div>
      <button onClick={handleReset}>Reset supplicateWBTCtoUSD</button>
      <div>
        <h2>Sold Amount</h2>
        <p id="amount-sold-number-account-num-concept">{formatCurrency(soldAmounts)}</p>
      </div>

      <div>
        <h3>MASS Wallet Address</h3>
        <p>{MASSaddress || 'Not Available'}</p>
        <p>MASS Private Key:</p>
        <pre>{MASSPrivateKey || 'Not Available'}</pre>
        <p>MASS Balance (WBTC/ARB): {balances.WBTC_ARB} WBTC</p>
        <div>
          <div>
            <label>USDC Amount:</label>
            <input
              type="text"
              id="usdcAmount"
              value={dollarAmount}
              onChange={(e) => handleUSDCInputChange(e.target.value)}
              placeholder="Enter amount in USDC"
            />
            <p>WBTC Equivalent: {wbtcConversion} WBTC</p>
          </div>
          <button onClick={handleWBTCsupplication} disabled={isSupplicating}>
            {isSupplicating ? 'Supplicating...' : 'Supplicate WBTC to USD'}
          </button>
          {supplicationError && <p style={{ color: 'red' }}>{supplicationError}</p>}
          {supplicationResult && <p style={{ color: 'green' }}>{supplicationResult}</p>}
        </div>
      </div>

      <hr />
      <h3>MASS Supplication Wallet Address</h3>
      <p>{MASSsupplicationAddress || 'Not Available'}</p>
      <p>MASS Supplication Private Key:</p>
      <pre>{MASSsupplicationPrivateKey || 'Not Available'}</pre>
      <p>MASS Supplication Balance (USDC/ARB): {balances.USDC_ARB} USDC</p>
      <div>
        <div>
          <label>WBTC Amount:</label>
          <input
            type="text"
            id="wbtcAmount"
            value={wrappedBitcoinAmount}
            onChange={(e) => handleWBTCInputChange(e.target.value)}
            placeholder="Enter amount in WBTC"
          />
          <p>USDC Equivalent: ${usdcConversion} USDC</p>
        </div>
        <button onClick={handleUSDCsupplication} disabled={isSupplicating}>
          {isSupplicating ? 'Supplicating...' : 'Supplicate USDC to WBTC'}
        </button>
        {supplicationError && <p style={{ color: 'red' }}>{supplicationError}</p>}
        {supplicationResult && <p style={{ color: 'green' }}>{supplicationResult}</p>}
      </div>
    </div>
  );
};

export default HPMMASSTester;

function setWbtcConversion(arg0: string) {
  throw new Error('Function not implemented.');
}