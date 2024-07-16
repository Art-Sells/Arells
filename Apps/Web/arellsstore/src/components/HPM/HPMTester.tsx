'use client';

import React, { useEffect, useState } from 'react';
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
    exportAmount,
    setExportAmount,
    handleBuy,
    handleSell,
    handleExport,
    fetchVatopGroups,
  } = useHPM();

  const [localExportAmount, setLocalExportAmount] = useState<number>(0);
  const [localTotalExportedWalletValue, setLocalTotalExportedWalletValue] = useState<string>('$0');
  const [localYouWillLose, setLocalYouWillLose] = useState<string>('$0');

  const handleBuyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuyAmount(Number(e.target.value));
  };

  const handleSellAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSellAmount(Number(e.target.value));
  };

  const handleExportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalExportAmount(Number(e.target.value));
  };

  useEffect(() => {
    fetchVatopGroups(); // Fetch vatop groups when component mounts
  }, [fetchVatopGroups]);

  useEffect(() => {
    // Update local state for real-time calculations
    const updateExportCalculations = () => {
      let remainingAmount = localExportAmount;
      const updatedGroups = [...vatopGroups].sort((a, b) => parseCurrency(b.cpVatop) - parseCurrency(a.cpVatop));
      let totalValue = 0;
      let totalLoss = 0;

      for (let i = 0; i < updatedGroups.length && remainingAmount > 0; i++) {
        const group = updatedGroups[i];
        const exportAmount = Math.min(parseNumber(group.cVactTa), remainingAmount);
        remainingAmount -= exportAmount;

        const originalCdVatop = parseCurrency(group.cdVatop);
        const originalCVactTa = parseNumber(group.cVactTa);
        const lossFraction = exportAmount / originalCVactTa;

        const newCdVatop = originalCdVatop * lossFraction;

        totalValue += exportAmount * bitcoinPrice;
        if (newCdVatop < 0) {
          totalLoss += newCdVatop;
        }
      }

      setLocalTotalExportedWalletValue(formatCurrency(totalValue));
      setLocalYouWillLose(formatCurrency(Math.abs(totalLoss)));
    };

    updateExportCalculations();
  }, [localExportAmount, vatopGroups, bitcoinPrice]);

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
          <input type="number" value={buyAmount} onChange={handleBuyAmountChange} />
        </label>
        <button onClick={() => handleBuy(buyAmount)}>Buy</button>
      </div>
      <div>
        <label>
          Sell Amount:
          <input type="number" value={sellAmount} onChange={handleSellAmountChange} />
        </label>
        <button onClick={() => handleSell(sellAmount)}>Sell</button>
      </div>
      <div>
        <label>
          Export Amount:
          <input type="number" value={localExportAmount} onChange={handleExportAmountChange} />
        </label>
        <button onClick={() => handleExport(localExportAmount)}>Export</button>
      </div>
      <div>
        <h2>Total Exported Wallet Value: {localTotalExportedWalletValue}</h2>
        <h2>You Will Lose: {localYouWillLose}</h2>
      </div>
      <div>
        <h2>HPAP: {hpap}</h2>
        <h2>Vatop Groups:</h2>
        {vatopGroups.length > 0 ? (
          vatopGroups.map((group, index) => (
            <div key={index}>
              <h3>Vatop Group {index + 1}</h3>
              <p>cVatop: {group.cVatop}</p>
              <p>cpVatop: {group.cpVatop}</p>
              <p>cVact: {group.cVact}</p>
              <p>cVactTa: {group.cVactTa}</p>
              <p>cdVatop: {group.cdVatop}</p>
            </div>
          ))
        ) : (
          <p>No Vatop Groups available</p>
        )}
      </div>
      <div>
        <h2>Vatop Group Combinations:</h2>
        <p>acVatops: {vatopCombinations.acVatops}</p>
        <p>acVacts: {vatopCombinations.acVacts}</p>
        <p>acVactTas: {vatopCombinations.acVactTas}</p>
        <p>acdVatops: {vatopCombinations.acdVatops}</p>
        <p>acVactsAts: {vatopCombinations.acVactsAts}</p>
        <p>acVactTaAts: {vatopCombinations.acVactTaAts}</p>
      </div>
    </div>
  );
};

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const parseCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(/[$,]/g, ''));
};

const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value);
};

export default HPMTester;