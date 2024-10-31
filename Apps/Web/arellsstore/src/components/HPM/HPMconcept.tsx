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
  } = useHPM();

  const [manualPrice, setManualPrice] = useState<number>(bitcoinPrice);
  const [totalSoldAmount, setTotalSoldAmount] = useState<number>(0); // New state for tracking sold amount

  const handleManualPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualPrice(Number(e.target.value));
  };

  const applyManualPrice = () => {
    setManualBitcoinPrice(manualPrice);
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
  };

  // Custom handleSell function to update total sold amount
  const handleSellWithTotalUpdate = (amount: number) => {
    handleSell(amount); // Call the original handleSell function
    setTotalSoldAmount((prev) => prev + amount); // Update total sold amount
  };

  return (
    <div>
      <h1>HPM Tester</h1>
      <div>
        <label>Bitcoin Price: ${bitcoinPrice}</label>
      </div>
      <div>
        <label>
          Set Manual Bitcoin Price:
          <input type="number" value={manualPrice} onChange={handleManualPriceChange} />
        </label>
        <button onClick={applyManualPrice}>Apply Price</button>
      </div>
      <div>
        <label>Amount:</label>
        <input type="number" value={buyAmount} onChange={(e) => setBuyAmount(Number(e.target.value))} />
        <button onClick={() => handleBuy(buyAmount)}>Buy</button>
      </div>
      <div>
        <label>Sell Amount:</label>
        <input type="number" value={sellAmount} onChange={(e) => setSellAmount(Number(e.target.value))} />
        <button onClick={() => handleSellWithTotalUpdate(sellAmount)}>Sell</button>
      </div>
      
      {/* Amount Sold Section */}
      <div>
        <h2>Amount Sold: {formatCurrency(totalSoldAmount)}</h2>
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