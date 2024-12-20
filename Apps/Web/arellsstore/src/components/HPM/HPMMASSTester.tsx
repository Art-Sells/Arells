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
    resetVatopGroups,
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
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

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

  const handleResetVatopGroups = () => {
    if (confirm('Are you sure you want to reset all vatop groups? This action cannot be undone.')) {
      resetVatopGroups();
    }
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
        wrappedBitcoinAmount: parseFloat(wrappedBitcoinAmount as string) * 1e8,
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
        massSupplicationAddress: MASSsupplicationAddress,
      });

      const { wbtcAmount, txId } = response.data;
      setConversionResult(`Conversion successful! Received ${wbtcAmount} WBTC. Transaction ID: ${txId}`);
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

    if (!MASSsupplicationAddress || !MASSsupplicationPrivateKey || !MASSaddress) {
      setConversionError('Wallet information is missing.');
      return;
    }

    setConversionError(null);
    setIsConverting(true);

    try {
      const response = await axios.post('/api/MASSsupplicationApi', {
        usdcAmount: Math.floor(Number(dollarAmount) * 1e6),
        massSupplicationAddress: MASSsupplicationAddress,
        massSupplicationPrivateKey: MASSsupplicationPrivateKey,
        massAddress: MASSaddress,
      });

      const { receivedAmount, txId } = response.data;
      setConversionResult(`Supplication successful! Received ${receivedAmount} WBTC. Transaction ID: ${txId}`);
    } catch (error: any) {
      setConversionError('Supplication failed. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };


  const handleReset = () => {
    resetSupplicateWBTCtoUSD();
    console.log('SupplicateWBTCtoUSD has been reset for all groups.');
  };

  return (
    <div>
      <h1>HPM and MASS Tester</h1>
      <h2>Bitcoin Price</h2>
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
      <button onClick={handleResetVatopGroups}>Reset Vatop Groups</button>
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
      </div>

      <hr />
      <h3>MASS Supplication Wallet Address</h3>
      <p>{MASSsupplicationAddress || 'Not Available'}</p>
      <p>MASS Supplication Private Key:</p>
      <pre>{MASSsupplicationPrivateKey || 'Not Available'}</pre>
      <p>MASS Supplication Balance (USDC/ARB): {balances.USDC_ARB} USDC</p>
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
    </div>
  );
};

export default HPMMASSTester;