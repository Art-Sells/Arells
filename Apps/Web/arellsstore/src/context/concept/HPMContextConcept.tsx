'use client';

import React, { createContext, useContext, useState } from 'react';

interface VatopGroup {
  cVatop: number;
  cpVatop: number;
  cVact: number;
  cVactTa: number;
  cdVatop: number;
  cpVact: number; // Reflects corresponding price value at the highest observed price
  highestBitcoinPrice: number; // Tracks the highest observed Bitcoin price for this group
}

interface VatopCombinations {
  acVatops: number;
  acVacts: number;
  acVactTas: number;
  acdVatops: number;
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
  });
  const [hpap, setHpap] = useState<number>(60000);
  const [email, setEmail] = useState<string>('');
  const [soldAmount, setSoldAmount] = useState<number>(0);

  const updateAllState = (newBitcoinPrice: number, updatedGroups: VatopGroup[]) => {
    const epsilon = 0.0001; // Precision threshold
  
    const filteredGroups = updatedGroups.map((group) => {
      const newHighestPrice = Math.max(group.highestBitcoinPrice || group.cpVatop, newBitcoinPrice);
  
      // Ensure `cVact` reflects `cpVact` and `cVactTa`
      const newCpVact = newHighestPrice;
      const newCVact = group.cVactTa * newCpVact;
  
      return {
        ...group,
        highestBitcoinPrice: newHighestPrice,
        cpVact: newCpVact,
        cVact: newCVact, // cVact reflects cpVact * cVactTa
        cdVatop: group.cVactTa * (newCpVact - group.cpVatop), // Update cdVatop
      };
    });
  
    // Retain only groups where `cVact > epsilon`
    const retainedGroups = filteredGroups.filter((group) => group.cVact > epsilon);
  
    const newVatopCombinations = retainedGroups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop;
        acc.acVacts += parseFloat(group.cVact.toFixed(2));
        acc.acVactTas += parseFloat(group.cVactTa.toFixed(7));
        acc.acdVatops += group.cdVatop > 0 ? parseFloat(group.cdVatop.toFixed(2)) : 0;
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactTas: 0,
        acdVatops: 0,
      } as VatopCombinations
    );
  
    if (retainedGroups.length > 0) {
      const maxCpVatop = Math.max(...retainedGroups.map((group) => group.cpVatop));
      const maxCpVact = Math.max(...retainedGroups.map((group) => group.cpVact));
      setHpap(maxCpVact > maxCpVatop ? maxCpVact : maxCpVatop);
    } else {
      setHpap(newBitcoinPrice);
    }
  
    setVatopGroups(retainedGroups);
    setVatopCombinations(newVatopCombinations);
  };
  
  const setManualBitcoinPrice = (price: number | ((currentPrice: number) => number)) => {
    setBitcoinPrice((currentPrice) => {
      const newPrice = typeof price === 'function' ? price(currentPrice) : price;
  
      const updatedGroups = vatopGroups.map((group) => {
        const newHighestPrice = Math.max(group.highestBitcoinPrice || group.cpVatop, newPrice);
  
        return {
          ...group,
          highestBitcoinPrice: newHighestPrice,
          cpVact: newHighestPrice, // Reflect the highest Bitcoin price
          cVact: group.cVactTa * Math.max(newPrice, hpap), // Reflect the new effective price
          cdVatop: group.cVactTa * (newHighestPrice - group.cpVatop), // Recalculate profit
        };
      });
  
      updateAllState(newPrice, updatedGroups);
      return newPrice;
    });
  };
  

  const handleBuy = (amount: number) => {
    if (amount <= 0) return;
  
    const currentImportPrice = bitcoinPrice;
  
    const newVatop: VatopGroup = {
      cVatop: amount,
      cpVatop: currentImportPrice,
      cVact: currentImportPrice, // Reflect cpVact by default
      cpVact: currentImportPrice,
      cVactTa: amount / currentImportPrice,
      cdVatop: 0,
      highestBitcoinPrice: currentImportPrice,
    };
  
    const updatedVatopGroups = [...vatopGroups, newVatop];
    updateAllState(bitcoinPrice, updatedVatopGroups);
  };

  const handleSell = (amount: number) => {
    if (amount <= 0 || vatopCombinations.acVacts <= 0) {
      return;
    }
  
    let remainingAmount = amount;
    const epsilon = 0.0001; // Precision threshold
  
    const updatedVatopGroups = vatopGroups.map((group) => {
      if (remainingAmount <= 0) return group;
  
      const sellAmount = Math.min(group.cVact, remainingAmount); // Max we can sell from this group
      remainingAmount -= sellAmount;
  
      // Updated values after the sell
      const updatedCVact = Math.max(group.cVact - sellAmount, 0); // Ensure no negative values
      const updatedCVactTa = Math.max(group.cVactTa - sellAmount / bitcoinPrice, 0); // Ensure no negative values
      const updatedCVatop = Math.max(group.cVatop - sellAmount, 0); // Ensure no negative values
  
      return {
        ...group,
        cVatop: updatedCVatop,
        cVact: updatedCVact,
        cVactTa: updatedCVactTa,
        cdVatop: updatedCVactTa > epsilon ? updatedCVactTa * (group.cpVact - group.cpVatop) : 0, // Update cdVatop
      };
    });
  
    // Retain only groups where cVact is strictly greater than epsilon
    const retainedGroups = updatedVatopGroups.filter((group) => group.cVact > epsilon);
  
    // Calculate the actual sold amount and update state
    const actualSoldAmount = amount - remainingAmount;
    setSoldAmount((prevSoldAmount) => prevSoldAmount + actualSoldAmount);
  
    // Update the state with the remaining groups
    updateAllState(bitcoinPrice, retainedGroups);
  };

  return (
    <HPMContextConcept.Provider
      value={{
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
      }}
    >
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