'use client';

import React, { createContext, useContext, useState } from 'react';

interface VatopGroup {

  cVatop: number;
  cpVatop: number;
  cdVatop: number;

  cVact: number;
  cpVact: number;
  cVactTa: number;
  cVactDa: number;

  HAP: number;
}

interface VatopCombinations {
  acVatops: number;
  acVacts: number;
  acVactTas: number;
  acVactDas: number; // Aggregate Dollar Amount
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

const HPMContext = createContext<HPMContextType | undefined>(undefined);

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
    acVactDas: 0,
  });
  const [hpap, setHpap] = useState<number>(60000);
  const [email, setEmail] = useState<string>('');
  const [soldAmount, setSoldAmount] = useState<number>(0);

  const updateAllState = (newBitcoinPrice: number, updatedGroups: VatopGroup[]) => {
    const epsilon = 0.0001; // Precision threshold
  
    const processedGroups = updatedGroups.map((group) => {
      const newHighestPrice = Math.max(group.HAP || group.cpVatop, newBitcoinPrice);
      const newCpVact = newHighestPrice;
      const newCVact = group.cVactTa * newCpVact;
      const newCVactDa = newBitcoinPrice > 0 && newBitcoinPrice <= group.cpVatop ? newCVact : 0;
  
      return {
        ...group,
        HAP: newHighestPrice,
        cpVact: parseFloat(newCpVact.toFixed(2)),
        cVact: parseFloat(Math.max(newCVact, 0).toFixed(2)), // Ensure no negative values and format to 2 decimals
        cVactDa: parseFloat(newCVactDa.toFixed(2)), // Format to 2 decimals
        cVactTa: parseFloat(group.cVactTa.toFixed(7)), // Format to 7 decimals
        cdVatop: parseFloat((group.cVactTa * (newCpVact - group.cpVatop)).toFixed(2)), // Format to 2 decimals
        cVatop: parseFloat(group.cVatop.toFixed(2)), // Format to 2 decimals
      };
    });
  
    // Modify retention logic to keep groups where cVactTa > epsilon
    const retainedGroups = processedGroups.filter(
      (group) =>
        group.cVact > epsilon || group.cVactTa > epsilon || group.cVatop > epsilon
    );
  
    console.log("Processed Groups:", processedGroups);
    console.log("Retained Groups:", retainedGroups);
  
    const newVatopCombinations = retainedGroups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop;
        acc.acVacts += group.cVact;
        acc.acVactTas += group.cVactTa;
        acc.acVactDas += group.cVactDa;
        acc.acdVatops += group.cdVatop > 0 ? group.cdVatop : 0;
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactTas: 0,
        acVactDas: 0,
        acdVatops: 0,
      } as VatopCombinations
    );
  
    setVatopGroups(retainedGroups);
    setVatopCombinations({
      acVatops: parseFloat(newVatopCombinations.acVatops.toFixed(2)),
      acVacts: parseFloat(newVatopCombinations.acVacts.toFixed(2)),
      acVactTas: parseFloat(newVatopCombinations.acVactTas.toFixed(7)),
      acVactDas: parseFloat(newVatopCombinations.acVactDas.toFixed(2)),
      acdVatops: parseFloat(newVatopCombinations.acdVatops.toFixed(2)),
    });
  
    if (retainedGroups.length > 0) {
      const maxCpVatop = Math.max(...retainedGroups.map((group) => group.cpVatop));
      const maxCpVact = Math.max(...retainedGroups.map((group) => group.cpVact));
      setHpap(maxCpVact > maxCpVatop ? maxCpVact : maxCpVatop);
    } else {
      setHpap(newBitcoinPrice);
    }
  };
  
  const setManualBitcoinPrice = (price: number | ((currentPrice: number) => number)) => {
    setBitcoinPrice((currentPrice) => {
      const newPrice = typeof price === 'function' ? price(currentPrice) : price;
  
      const updatedGroups = vatopGroups.map((group) => {
        const newHighestPrice = Math.max(group.HAP || group.cpVatop, newPrice);
  
        return {
          ...group,
          HAP: newHighestPrice,
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
    if (amount <= 0) {
      return;
    }
  
    const currentImportPrice = bitcoinPrice > 0 ? bitcoinPrice : 0;
  
    const newVatop: VatopGroup = {
      cVatop: amount,
      cpVatop: currentImportPrice,
      cVact: currentImportPrice > 0 ? amount : 0,
      cpVact: currentImportPrice,
      cVactTa: currentImportPrice > 0 ? amount / currentImportPrice : amount,
      cVactDa: currentImportPrice > 0 ? amount : 0,
      cdVatop: 0,
      HAP: currentImportPrice,
    };
    const updatedVatopGroups = [...vatopGroups, newVatop];
  
    updateAllState(currentImportPrice, updatedVatopGroups);
  
  };

  const handleSell = (amount: number) => {
    if (amount <= 0 || vatopCombinations.acVacts <= 0) {
      return;
    }
  
    let remainingAmount = amount;
    const epsilon = 0.0001; // Precision threshold
  
    const updatedVatopGroups = vatopGroups.map((group) => {
      if (remainingAmount <= 0) return group;
  
      const sellAmount = Math.min(group.cVact, remainingAmount); // Max sellable from this group
      remainingAmount -= sellAmount;
  
      const updatedCVact = Math.max(group.cVact - sellAmount, 0); // Ensure non-negative values
      const updatedCVactTa = Math.max(group.cVactTa - sellAmount / group.cpVact, 0); // Ensure non-negative values
      const updatedCVatop = Math.max(group.cVatop - sellAmount, 0); // Ensure non-negative values
  
      return {
        ...group,
        cVatop: updatedCVatop,
        cVact: updatedCVact,
        cVactTa: updatedCVactTa,
        cVactDa: group.cVactDa, // Keep as-is unless logic requires update
        cdVatop: updatedCVactTa > epsilon ? updatedCVactTa * (group.cpVact - group.cpVatop) : 0, // Update cdVatop
      };
    });
  
    // Retain groups where relevant attributes are above epsilon
    const retainedGroups = updatedVatopGroups.filter(
      (group) =>
        group.cVatop > epsilon || group.cVact > epsilon || group.cVactTa > epsilon
    );
  
    // Update state with the actual sold amount and retained groups
    const actualSoldAmount = amount - remainingAmount;
    setSoldAmount((prevSoldAmount) => prevSoldAmount + actualSoldAmount);
  
    updateAllState(bitcoinPrice, retainedGroups);
  };

  return (
    <HPMContext.Provider
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