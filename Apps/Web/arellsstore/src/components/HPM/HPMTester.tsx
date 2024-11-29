'use client';

import React, { useState, useEffect } from 'react';
import { useHPM } from '../../context/HPMContext';

const HPMTester: React.FC = () => {
  const {
    bitcoinPrice,
    vatopGroups,
    vatopCombinations,
    hpap, // Including hpap
    handleBuy,
    handleSell,
    handleImportABTC,
    readABTCFile,
    setManualBitcoinPrice,
    soldAmount
  } = useHPM();

  const [inputBuyAmount, setInputBuyAmount] = useState<string>('');
  const [inputSellAmount, setInputSellAmount] = useState<string>('');
  const [inputImportAmount, setInputImportAmount] = useState<string>('');
  const [aBTC, setABTC] = useState<number>(0);

  useEffect(() => {
    const fetchABTC = async () => {
      const fetchedABTC = await readABTCFile();
      setABTC(fetchedABTC || 0);
    };
    fetchABTC();
  }, [readABTCFile]);

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00'; // Return a default value for invalid inputs
    }
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.0000000'; // Return a default value for invalid inputs
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });
  };
  const handleIncreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 1000); // Increase by $1000
  };

  const handleDecreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(currentPrice - 1000, 0)); // Decrease by $1000 but not below $0
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
    // Parse sell amount as a float
    const amount = parseFloat(inputSellAmount.replace(/,/g, '').trim()) || 0; // Remove commas before parsing
    if (amount > 0) {
      console.log("Sell Amount (USD):", amount); // Debug log
      handleSell(amount); // Pass the exact amount
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

  return (
    <div>
      <h1>HPM Tester</h1>
      <h2>Bitcoin Price</h2>
        <h3>${formatCurrency(bitcoinPrice)}</h3>
        <button onClick={handleIncreasePrice}>Increase Price</button>
        <button onClick={handleDecreasePrice}>Decrease Price</button>
      {/* <div>
        <label>Buy Amount:</label>
        <input
          type="text"
          value={inputBuyAmount}
          onChange={(e) => setInputBuyAmount(e.target.value)}
        />
        <button onClick={handleBuyClick}>Buy</button>
      </div> */}
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
        <div>
          <h2>HPAP:</h2>
          <h3>${formatCurrency(hpap)}</h3>
        </div>
        <div>
          <h2>aBTC:</h2>
          <p>{formatNumber(aBTC)}</p>
        </div>
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
      <div>
        <h2>Sold Amount</h2>
        <p id="amount-sold-number-account-num-concept">
          {formatCurrency(soldAmount)}
        </p>
      </div>
    </div>
  );
};

export default HPMTester;