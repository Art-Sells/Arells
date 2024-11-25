'use client';

import React, { useState } from 'react';
import { useHPM } from '../../context/HPMContext';

const HPMTester: React.FC = () => {
  const {
    bitcoinPrice,
    vatopGroups,
    vatopCombinations,
    hpap,
    buyAmount,
    setBuyAmount,
    sellAmount,
    setSellAmount,
    handleBuy,
    handleSell,
    handleImport,
    setManualBitcoinPriceConcept,
    setManualBitcoinPrice,
    email,
    soldAmount,
  } = useHPM();

  const [inputBuyAmount, setInputBuyAmount] = useState<string>('');
  const [inputImportAmount, setInputImportAmount] = useState<string>('');
  const [inputSellAmount, setInputSellAmount] = useState<string>('');
  const [payload, setPayload] = useState<any>(null); // State to store payload

  const formatCurrency = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      value = 0; // Default to 0 if the value is undefined, null, or NaN
    }
    return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      value = 0; // Default to 0 if the value is undefined, null, or NaN
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 7,
    });
  };

  const increasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 20);
  };

  const decreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(0, currentPrice - 20));
  };

  const formatWithCommas = (value: string) => {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Format integer part with commas
    return parts.join('.');
  };

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 2)}`; // Keep only two decimal places
    }
    setInputBuyAmount(formatWithCommas(numericValue)); // Format for display
    setBuyAmount(parseFloat(numericValue) || 0); // Store numeric value
  };

  const handleImportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 5)}`; // Keep only five decimal places
    }
    setInputImportAmount(formatWithCommas(numericValue)); // Format for display
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 2)}`; // Keep only two decimal places
    }
    setInputSellAmount(formatWithCommas(numericValue)); // Format for display
    setSellAmount(parseFloat(numericValue) || 0); // Store numeric value
  };


  const handleBuyClick = async () => {
    const buyAmount = parseFloat(inputBuyAmount.replace(/,/g, '')) || 0;
    if (buyAmount > 0) {
      await handleBuy(buyAmount);

      const newPayload = {
        email,
        vatopGroups,
        vatopCombinations,
      };
      setPayload(newPayload);
      setInputBuyAmount(''); // Clear input
    } else {
      alert('Invalid buy amount');
    }
  };

  const handleImportClick = async () => {
    const importAmount = parseFloat(inputImportAmount.replace(/,/g, '')) || 0;
    if (importAmount < 0.0001) {
      alert('The minimum import amount is 0.0001 BTC.');
      return;
    }
    if (importAmount > 0) {
      await handleImport(importAmount);
  
      const newPayload = {
        email,
        vatopGroups,
        vatopCombinations,
      };
      setPayload(newPayload);
      setInputImportAmount(''); // Clear input
      window.location.reload(); // Reload the page after import
    } else {
      alert('Invalid import amount');
    }
  };
  
  const handleSellClick = async () => {
    const sellAmount = parseFloat(inputSellAmount.replace(/,/g, '')) || 0;
    if (sellAmount > 0 && sellAmount <= vatopCombinations.acVacts) {
      await handleSell(sellAmount);
  
      const newPayload = {
        email,
        vatopGroups,
        vatopCombinations,
      };
      setPayload(newPayload);
      setInputSellAmount(''); // Clear input
      window.location.reload(); // Reload the page after sell
    } else {
      alert('Invalid sell amount');
    }
  };

  console.log("Rendering vatopGroups from Context:", vatopGroups);

  return (
    <div>
      <h1>HPM Tester</h1>
      <div>
        <label>Bitcoin Price: ${formatCurrency(bitcoinPrice)}</label>
        <div>
          <button onClick={increasePrice}>Increase Price</button>
          <button onClick={decreasePrice}>Decrease Price</button>
        </div>
      </div>
      <div>
        <label>Import Amount (BTC):</label>
        <input
          type="text"
          value={inputImportAmount}
          onChange={handleImportAmountChange}
        />
        <button onClick={handleImportClick}>Import</button>
      </div>
      {/* <div>
        <label>Buy Amount:</label>
        <input
          type="text"
          value={inputBuyAmount}
          onChange={handleBuyAmountChange}
        />
        <button onClick={handleBuyClick}>Buy</button>
      </div> */}
      <div>
        <label>Sell Amount:</label>
        <input
          type="text"
          value={inputSellAmount}
          onChange={handleSellAmountChange}
        />
        <button onClick={handleSellClick}>Sell</button>
      </div>
      <h2>HPAP: {formatCurrency(hpap)}</h2>
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
      </div>
    </div>
  );
};

export default HPMTester;