'use client';

import React, { useState } from 'react';
import { useHPM } from '../../context/concept/HPMContextConcept';

const HPMConcept: React.FC = () => {
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

  const increasePrice = () => {
    setManualBitcoinPrice((currentPrice) => currentPrice + 5000);
  };

  const decreasePrice = () => {
    setManualBitcoinPrice((currentPrice) => Math.max(0, currentPrice - 5000));
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };

  const [inputBuyAmount, setInputBuyAmount] = useState<number>(0);

  const handleBuyClick = () => {
    setBuyAmount(inputBuyAmount);
    handleBuy(inputBuyAmount);
  };

  return (
    <div>
      <h1>HPM Tester</h1>
      <div>
        <label>Bitcoin Price: {formatCurrency(bitcoinPrice)}</label>
        <div>
          <button onClick={increasePrice}>Increase by $5,000</button>
          <button onClick={decreasePrice}>Decrease by $5,000</button>
        </div>
      </div>
      <div>
        <label>Amount:</label>
        <input 
          type="number" 
          value={inputBuyAmount} 
          onChange={(e) => setInputBuyAmount(Number(e.target.value))}
        />
        <button onClick={handleBuyClick}>Buy</button>
      </div>
      <div>
        <label>Sell Amount:</label>
        <input type="number" value={sellAmount} onChange={(e) => setSellAmount(Number(e.target.value))} />
        <button onClick={() => handleSell(sellAmount)}>Sell</button>
      </div>
      
      {/* Amount Sold Section */}
      <div>
        <h2>Amount Sold: {formatCurrency(soldAmount)}</h2>
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
              <p>cVactTa: {formatNumber(group.cVactTa)}</p>
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
        <p>acdVatops: {formatCurrency(vatopCombinations.acdVatops)}</p>
        <p>acVactsAts: {formatCurrency(vatopCombinations.acVactsAts)}</p>
        <p>acVactTaAts: {formatNumber(vatopCombinations.acVactTaAts)}</p>
      </div>
    </div>
  );
};

export default HPMConcept;