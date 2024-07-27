'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { createBoughtAmountTransaction, createExportedAmountTransaction, createSoldAmountTransaction } from '../lib/transactions';

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
  exportAmount: number;
  importAmount: number;
  totalExportedWalletValue: number;
  youWillLose: number;
  setBuyAmount: (amount: number) => void;
  setSellAmount: (amount: number) => void;
  setExportAmount: (amount: number) => void;
  setImportAmount: (amount: number) => void;
  handleBuy: (amount: number) => void;
  handleSell: (amount: number) => void;
  setManualBitcoinPrice: (price: number) => void;
  updateVatopCombinations: (groups: VatopGroup[]) => VatopCombinations;
  email: string;
}

const HPMContext = createContext<HPMContextType | undefined>(undefined);

export const HPMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [exportAmount, setExportAmount] = useState<number>(0);
  const [importAmount, setImportAmount] = useState<number>(0);
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
  const [totalExportedWalletValue, setTotalExportedWalletValue] = useState<number>(0);
  const [youWillLose, setYouWillLose] = useState<number>(0);
  const [email, setEmail] = useState<string>('');
  const [refreshData, setRefreshData] = useState<boolean>(false);

  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
    const acVatops = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVatop, 0);
    const acVacts = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVact, 0);
    const acVactTas = groups.reduce((acc: number, group: VatopGroup) => acc + group.cVactTa, 0);
    const acdVatops = groups.reduce((acc: number, group: VatopGroup) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
      return profit > 0 ? acc + profit : acc;
    }, 0);
    const acVactsAts = groups.reduce((acc: number, group: VatopGroup) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
      return profit > 0 ? acc + group.cVact : acc;
    }, 0);
    const acVactTaAts = groups.reduce((acc: number, group: VatopGroup) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
      return profit > 0 ? acc + group.cVactTa : acc;
    }, 0);
  
    const updatedCombinations: VatopCombinations = {
      acVatops,
      acVacts,
      acVactTas,
      acdVatops,
      acVactsAts,
      acVactTaAts,
    };
  
    setVatopCombinations(updatedCombinations);
    return updatedCombinations;
  };

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBitcoinPrice();
      setBitcoinPrice(price);
    };
    fetchPrice();
    }, []);
    
    // useEffect(() => {
    // const fetchEmail = async () => {
    // try {
    // const attributesResponse = await fetchUserAttributes();
    // const emailAttribute = attributesResponse.email;
    // if (emailAttribute) {
    // setEmail(emailAttribute);
    // }
    // } catch (error) {
    // console.error('Log In or Sign Up to access Arells.');
    // }
    // }; fetchEmail();}, []);

    const fetchVatopGroups = useCallback(async () => {
    try {
    if (!email) {
    return;
    }   const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
    const fetchedVatopGroups: VatopGroup[] = response.data.vatopGroups || [];
    const fetchedVatopCombinations: VatopCombinations = response.data.vatopCombinations || {};
  
    const updatedVatopGroups = fetchedVatopGroups.map((group: VatopGroup) => {
      const initialCost = group.cVactTa * group.cpVatop;
      const currentValue = group.cVactTa * bitcoinPrice;
      const profit = currentValue - initialCost;
  
      return {
        ...group,
        cVact: group.cVactTa * bitcoinPrice,
        cdVatop: profit,
      };
    });
  
    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups);
  
  } catch (error) {
    console.error('Error fetching vatop groups:', error);
  }}, [email, bitcoinPrice]);

  useEffect(() => {
  fetchVatopGroups();
  const interval = setInterval(() => {
  fetchVatopGroups();
  }, 10000); // Set the interval to 10 seconds
  return () => clearInterval(interval);
  }, [fetchVatopGroups]);
  
  useEffect(() => {
  const updatedVatopGroups = vatopGroups
  .map((group) => ({...group,
  cVact: group.cVactTa * bitcoinPrice,
  cdVatop: (group.cVactTa * bitcoinPrice) - group.cVatop,
  }))
  .filter((group) => group.cVact > 0);
  setVatopGroups(updatedVatopGroups);
  updateVatopCombinations(updatedVatopGroups);
  }, [bitcoinPrice]);
  
  useEffect(() => {
  const highestCpVatop = Math.max(...vatopGroups.map((group) => group.cpVatop), 0);
  if (bitcoinPrice > highestCpVatop) {
  setHpap(bitcoinPrice);
  } else {
  setHpap(highestCpVatop);
  }
  }, [vatopGroups, bitcoinPrice]);
  
  const handleBuy = async (amount: number) => {
  try {
  const newVatop: VatopGroup = {
  cVatop: amount,
  cpVatop: bitcoinPrice,
  cVact: amount,
  cVactTa: amount / bitcoinPrice,
  cdVatop: 0,
  };
  const updatedVatopGroups = [...vatopGroups, newVatop];
  setVatopGroups(updatedVatopGroups);
  const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);
  const responseTransactions = await axios.get(`/api/fetchVatopGroups?email=${email}`);
  const updatedTransactions = responseTransactions.data.transactions || [];

  const payload = {
    email,
    vatopGroups: updatedVatopGroups,
    vatopCombinations: updatedVatopCombinations,
  };

  console.log('Payload being sent to the server:', payload);

  const response = await axios.post('/api/saveVatopGroups', payload);
  console.log('Response from server:', response.data);
  setRefreshData(true);
} catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    console.error('Error saving vatop groups:', error.response?.data || error.message, 'Full response:', error.response);
  } else {
    console.error('Unexpected error:', error);
  }
}};

const handleSell = async (amount: number) => {
  if (amount > vatopCombinations.acVactsAts) {
    return;
  }
  
  let remainingAmount = amount;
  const updatedVatopGroups = [...vatopGroups];
  updatedVatopGroups.sort((a, b) => a.cpVatop - b.cpVatop);
  
  for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
    const group = updatedVatopGroups[i];
    const sellAmount = Math.min(group.cVact, remainingAmount);
    remainingAmount -= sellAmount;
    group.cVatop -= sellAmount;
    group.cVact -= sellAmount;
    group.cVactTa -= sellAmount / bitcoinPrice;
    group.cdVatop = group.cVact - group.cVatop;
  
    if (group.cVactTa < 0.0000001) {
      const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
        return currentGroup.cVactTa > maxGroup.cVactTa ? currentGroup : maxGroup;
      }, updatedVatopGroups[0]);
      largestCactTaGroup.cVactTa += group.cVactTa;
      updatedVatopGroups.splice(i, 1);
      i--;
    }
  }
  
  const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);
  
  const payload = {
    email,
    vatopGroups: updatedVatopGroups,
    vatopCombinations: updatedVatopCombinations,
  };
  
  console.log('Payload:', payload);
  
  try {
    const response = await axios.post('/api/saveVatopGroups', payload);
    console.log('Response from server:', response.data);
  
    await fetchVatopGroups();
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Error saving vatop groups:', error.response?.data || error.message, 'Full response:', error.response);
    } else {
      console.error('Unexpected error:', error);
    }
  }};

  return (
  <HPMContext.Provider value={{
  bitcoinPrice,
  vatopGroups,
  vatopCombinations,
  hpap,
  buyAmount,
  sellAmount,
  exportAmount,
  importAmount,
  totalExportedWalletValue,
  youWillLose,
  setBuyAmount,
  setSellAmount,
  setExportAmount,
  setImportAmount,
  handleBuy,
  handleSell,
  setManualBitcoinPrice: setManualBitcoinPriceApi,
  updateVatopCombinations,
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