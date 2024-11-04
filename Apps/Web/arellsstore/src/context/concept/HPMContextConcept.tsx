'use client';

import React, { createContext, useContext, useState } from 'react';

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
  setManualBitcoinPrice: (price: number | ((currentPrice: number) => number)) => void;
  email: string;
  soldAmount: number;
}

const HPMContextConcept = createContext<HPMContextType | undefined>(undefined);

export const HPMConceptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(60000);
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
  const [hpap, setHpap] = useState<number>(60000);
  const [email, setEmail] = useState<string>('');
  const [soldAmount, setSoldAmount] = useState<number>(0);

  const updateAllState = (newBitcoinPrice: number, updatedGroups: VatopGroup[]) => {
    // Remove groups with cVact of 0
    const filteredGroups = updatedGroups.filter((group) => group.cVact > 0);

    const newVatopCombinations = filteredGroups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop;
        acc.acVacts += group.cVact;
        acc.acVactTas += group.cVactTa;

        const initialCost = group.cVactTa * group.cpVatop;
        const currentValue = group.cVactTa * newBitcoinPrice;
        const profit = currentValue - initialCost;
        if (profit > 0) {
          acc.acdVatops += profit;
          acc.acVactsAts += Math.round(group.cVact);
          acc.acVactTaAts += group.cVactTa;
        }

        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactTas: 0,
        acdVatops: 0,
        acVactsAts: 0,
        acVactTaAts: 0,
      } as VatopCombinations
    );

    setVatopCombinations(newVatopCombinations);

    const maxCpVatop = filteredGroups.length > 0 ? Math.max(...filteredGroups.map((group) => group.cpVatop)) : 0;
    setHpap(Math.max(newBitcoinPrice, maxCpVatop || newBitcoinPrice));

    setVatopGroups(filteredGroups);
  };

  const setManualBitcoinPrice = (price: number | ((currentPrice: number) => number)) => {
    setBitcoinPrice((currentPrice) => {
      const newPrice = typeof price === 'function' ? price(currentPrice) : price;

      const updatedGroups = vatopGroups.map((group) => ({
        ...group,
        cVact: group.cVactTa * newPrice,
        cdVatop: group.cVactTa * (newPrice - group.cpVatop),
      }));

      updateAllState(newPrice, updatedGroups);
      return newPrice;
    });
  };

  const handleBuy = (amount: number) => {
    if (amount <= 0) return;

    const newVatop: VatopGroup = {
      cVatop: amount,
      cpVatop: bitcoinPrice,
      cVact: amount,
      cVactTa: amount / bitcoinPrice,
      cdVatop: 0,
    };

    const updatedVatopGroups = [...vatopGroups, newVatop];
    updateAllState(bitcoinPrice, updatedVatopGroups);
  };

  const handleSell = (amount: number) => {
    if (amount <= 0 || amount > vatopCombinations.acVactsAts) return;
  
    let remainingAmount = amount;
    const updatedVatopGroups = [...vatopGroups].sort((a, b) => a.cpVatop - b.cpVatop);
  
    for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
      const group = updatedVatopGroups[i];
      const sellAmount = Math.min(Math.round(group.cVact), remainingAmount); // Ensure sellAmount is an integer
      remainingAmount -= sellAmount;
      group.cVatop -= sellAmount;
      group.cVact -= sellAmount;
      group.cVactTa -= sellAmount / bitcoinPrice;
      group.cdVatop = group.cVact - group.cVatop;
    }
  
    const actualSoldAmount = amount - remainingAmount;
    setSoldAmount((prevSoldAmount) => prevSoldAmount + actualSoldAmount);
  
    // Filter out groups with cVact of 0 after sell
    const filteredGroups = updatedVatopGroups.filter((group) => group.cVact > 0);

    const updatedAcVactsAts = filteredGroups.reduce((total, group) => total + Math.round(group.cVact), 0);
    setVatopCombinations((prev) => ({ ...prev, acVactsAts: updatedAcVactsAts }));
  
    updateAllState(bitcoinPrice, filteredGroups);
  };

  return (
    <HPMContextConcept.Provider value={{
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
      soldAmount,
    }}>
      {children}
    </HPMContextConcept.Provider>
  );
};

export const useHPM = () => {
  const context = useContext(HPMContextConcept);
  if (context === undefined) {
    throw new Error('useHPM must be used within an HPMProvider');
  }
  return context;
};