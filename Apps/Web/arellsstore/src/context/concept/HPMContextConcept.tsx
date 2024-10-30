'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface VatopGroup {
  cVatop: number;
  cpVatop: number;
  cVact: number;
  cVactTa: number;
  cdVatop: number;
}

interface VatopCombinations {
  acVatops: number;
  acVacts: number;
  acVactTas: number;
  acdVatops: number;
  acVactsAts: number;
  acVactTaAts: number;
}

interface HPMContextType {
  bitcoinPrice: number;
  vatopGroups: VatopGroup[];
  vatopCombinations: VatopCombinations;
  hpap: number;
  buyAmount: number;
  sellAmount: number;
  setBuyAmount: (amount: number) => void;
  setSellAmount: (amount: number) => void;
  handleBuy: (amount: number) => void;
  handleSell: (amount: number) => void;
  setManualBitcoinPrice: (price: number) => void;
  email: string;
}

const HPMContext = createContext<HPMContextType | undefined>(undefined);

export const HPMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>({
    acVatops: 0,
    acVacts: 0,
    acVactTas: 0,
    acdVatops: 0,
    acVactsAts: 0,
    acVactTaAts: 0,
  });
  const [hpap, setHpap] = useState<number>(0);
  const [email, setEmail] = useState<string>('');

  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
    const acVatops = groups.reduce((acc, group) => acc + group.cVatop, 0);
    const acVacts = groups.reduce((acc, group) => acc + group.cVact, 0);
    const acVactTas = groups.reduce((acc, group) => acc + group.cVactTa, 0);
    const acdVatops = groups.reduce((acc, group) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
      return profit > 0 ? acc + profit : acc;
    }, 0);
    const acVactsAts = groups.reduce((acc, group) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
      return profit > 0 ? acc + group.cVact : acc;
    }, 0);
    const acVactTaAts = groups.reduce((acc, group) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
      return profit > 0 ? acc + group.cVactTa : acc;
    }, 0);

    const updatedCombinations = { acVatops, acVacts, acVactTas, acdVatops, acVactsAts, acVactTaAts };
    setVatopCombinations(updatedCombinations);
    return updatedCombinations;
  };

  const setManualBitcoinPrice = (price: number) => setBitcoinPrice(price);

  const handleBuy = (amount: number) => {
    const newVatop: VatopGroup = {
      cVatop: amount,
      cpVatop: bitcoinPrice,
      cVact: amount,
      cVactTa: amount / bitcoinPrice,
      cdVatop: 0,
    };
    const updatedVatopGroups = [...vatopGroups, newVatop];
    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups);
  };

  const handleSell = (amount: number) => {
    if (amount > vatopCombinations.acVactsAts) return;
    let remainingAmount = amount;
    const updatedVatopGroups = [...vatopGroups].sort((a, b) => a.cpVatop - b.cpVatop);
    for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
      const group = updatedVatopGroups[i];
      const sellAmount = Math.min(group.cVact, remainingAmount);
      remainingAmount -= sellAmount;
      group.cVatop -= sellAmount;
      group.cVact -= sellAmount;
      group.cVactTa -= sellAmount / bitcoinPrice;
      group.cdVatop = group.cVact - group.cVatop;
      if (group.cVactTa < 0.0000001) updatedVatopGroups.splice(i, 1);
    }
    updateVatopCombinations(updatedVatopGroups);
    setVatopGroups(updatedVatopGroups);
  };

  return (
    <HPMContext.Provider value={{
      bitcoinPrice,
      vatopGroups,
      vatopCombinations,
      hpap,
      buyAmount,
      sellAmount,
      setBuyAmount,
      setSellAmount,
      handleBuy,
      handleSell,
      setManualBitcoinPrice,
      email,
    }}>
      {children}
    </HPMContext.Provider>
  );
};

export const useHPM = () => {
  const context = useContext(HPMContext);
  if (context === undefined) {
    throw new Error('useHPM must be used within an HPMProvider');
  }
  return context;
};