'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
    setImportAmount,
    handleBuy,
    handleSell,
    handleExport,
    updateVatopCombinations,
    email,
    soldAmounts,
  } = useHPM();

  const [localExportAmount, setLocalExportAmount] = useState<number>(0);
  const [localImportAmount, setLocalImportAmount] = useState<number>(0);
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

  const handleImportAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalImportAmount(Number(e.target.value));
  };

  const handleImportClick = async () => {
    setImportAmount(localImportAmount);
    const newAcVactTas = parseNumber(vatopCombinations.acVactTas) + localImportAmount;
    const updatedCombinations = {
      ...vatopCombinations,
      acVactTas: newAcVactTas, // Ensure it remains a number
    };
    console.log('Updating acVactTas:', updatedCombinations.acVactTas);
  
    try {
      console.log('Attempting to save updated vatop combinations:', updatedCombinations);
      const payload = { email, vatopGroups, vatopCombinations: updatedCombinations };
      console.log('Payload being sent:', payload);
      const response = await axios.post('/api/saveVatopGroups', payload);
      console.log('Response from server:', response.data);
      updateVatopCombinations(vatopGroups); // Ensure the local state is also updated
    } catch (error) {
      console.error('Error saving updated vatop combinations:', error);
    }
  };
  const handleWithdraw = async () => {
    try {
      const newSoldAmount = 0; // Ensure soldAmount is numeric
      const response = await axios.post('/api/saveVatopGroups', {
        email,
        vatopGroups,
        vatopCombinations,
        soldAmounts: newSoldAmount,
      });
      console.log('Withdraw response:', response.data);
      updateVatopCombinations(vatopGroups); // Trigger update to fetch new state
    } catch (error) {
      console.error('Error withdrawing sold amount:', error);
    }
  };

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
        <label>
          Import Amount:
          <input type="number" value={localImportAmount} onChange={handleImportAmountChange} />
        </label>
        <button onClick={handleImportClick}>Import</button>
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
      <div>
        <h2>Sold Amount: {soldAmounts}</h2>
        <button onClick={handleWithdraw}>Withdraw</button>
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

const formatNumber = (value: number): string => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
};

export default HPMTester;