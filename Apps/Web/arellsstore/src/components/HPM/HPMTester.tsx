'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useHPM } from '../../context/HPMContext';
import { Transactions, createWithdrewAmountTransaction, ParsedTransaction } from '../../lib/transactions';

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
    setManualBitcoinPrice,
    email,
    soldAmount,
  } = useHPM();

  const [localExportAmount, setLocalExportAmount] = useState<number>(0);
  const [localImportAmount, setLocalImportAmount] = useState<number>(0);
  const [localTotalExportedWalletValue, setLocalTotalExportedWalletValue] = useState<number>(0);
  const [localYouWillLose, setLocalYouWillLose] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transactions[]>([]);

  const increasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 5000);
  };

  const decreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(0, currentPrice - 5000));
  };

  const formatCurrency = (value: number): string => {
    return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };



  const [inputBuyAmount, setInputBuyAmount] = useState<string>("");
  const [inputSellAmount, setInputSellAmount] = useState<string>("");
  const formatWithCommas = (value: string) => {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // Format integer part with commas
    return parts.join('.');
  };
  
  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
  
    // Limit to two decimal places
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 2)}`; // Keep only the first two decimal places
    }
  
    setInputBuyAmount(formatWithCommas(numericValue)); // Format with commas for display
    setBuyAmount(parseFloat(numericValue) || 0); // Store as a number for calculations
  };
  
  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = e.target.value.replace(/[^0-9.]/g, ''); // Allow only numbers and decimal
  
    // Limit to two decimal places
    if (numericValue.includes('.')) {
      const [integer, decimals] = numericValue.split('.');
      numericValue = `${integer}.${decimals.slice(0, 2)}`; // Keep only the first two decimal places
    }
  
    setInputSellAmount(formatWithCommas(numericValue)); // Format with commas for display
    setSellAmount(parseFloat(numericValue) || 0); // Store as a number for calculations
  };

  const handleBuyClick = () => {
    // Remove commas from inputBuyAmount and convert to a float for processing
    const buyAmount = parseFloat(inputBuyAmount.replace(/,/g, '')) || 0;
  
    if (buyAmount > 0) {
      setTimeout(() => {
        setInputBuyAmount("");
      }, 0);
  
      setBuyAmount(buyAmount);
      handleBuy(buyAmount);
    } else {
      alert("invalid amount");
    }
  };

  
  const handleSellClick = () => {
    // Remove commas from inputSellAmount and convert to a float for comparison
    const sellAmount = parseFloat(inputSellAmount.replace(/,/g, '')) || 0;
  
    // Check if sellAmount is greater than acVactsAts
    if (sellAmount > vatopCombinations.acVacts) {
      return; // Exit the function
    }
  
    // Proceed with sell logic if the amount is valid
    if (sellAmount > 0 && sellAmount <= vatopCombinations.acVacts) {
      setTimeout(() => {
        setInputSellAmount('');
      }, 0);
  
      handleSell(sellAmount);
    } else {
      alert("invalid amount");
    }
  };
  

  return (
    <div>
      <h1>HPM Tester</h1>
      <div>
        <label>
          Bitcoin Price: ${bitcoinPrice}
        </label>
      </div>
      <div>
        <label>
          Buy Amount:
          <input 
            type="text" 
            inputMode="decimal" 
            onChange={handleBuyAmountChange}
            value={inputBuyAmount || ''} 
          />
        </label>
        <button 
          id="sell-account-concept"
          onClick={handleBuyClick}>
          IMPORT
          </button>
      </div>
      <div>
        <label>
          Sell Amount:
          <input 
            type="text" 
            inputMode="decimal" 
            onChange={handleSellAmountChange}
            value={inputSellAmount || ''}
          />
        </label>
        <button 
          onClick={handleSellClick}
        >
          Sell
        </button>
      </div>






    {/* Display Section */}
    <div>
      <h2>HPAP: {formatCurrency(hpap)}</h2>
      <h2>Vatop Groups:</h2>
      {vatopGroups.length > 0 ? (
        vatopGroups.map((group, index) => (
          <div key={index}>
            <h3>Vatop Group {index + 1}</h3>
            <p>cVatop: {formatCurrency(group.cVatop)}</p>
            <p>cpVatop: {formatCurrency(group.cpVatop)}</p>
            <p>cVact: {formatCurrency(group.cVact)}</p>
            <p>cpVact: {formatCurrency(group.cpVact)}</p>
            <p>cVactTa: {formatNumber(group.cVactTa)}</p>
            <p>cVactDa: {formatCurrency(group.cVactDa)}</p>
            <p>cdVatop: {formatCurrency(group.cdVatop)}</p>
          </div>
        ))
      ) : (
        <p>No Vatop Groups available</p>
      )}
    </div>
    <div>
      <h2>Vatop Group Combinations:</h2>
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

function setRefreshData(arg0: boolean) {
  throw new Error('Function not implemented.');
}


