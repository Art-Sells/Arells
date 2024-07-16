'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';

interface VatopGroup {
  cVatop: string;
  cpVatop: string;
  cVact: string;
  cVactTa: string;
  cdVatop: string;
}

interface VatopCombinations {
  acVatops: string;
  acVacts: string;
  acVactTas: string;
  acdVatops: string;
  acVactsAts: string;
  acVactTaAts: string;
}

interface HPMContextType {
  bitcoinPrice: number;
  vatopGroups: VatopGroup[];
  vatopCombinations: VatopCombinations;
  hpap: string;
  buyAmount: number;
  sellAmount: number;
  setBuyAmount: (amount: number) => void;
  setSellAmount: (amount: number) => void;
  handleBuy: (amount: number) => void;
  handleSell: (amount: number) => void;
  fetchVatopGroups: () => void;
  setManualBitcoinPrice: (price: number) => void;
}

const HPMContext = createContext<HPMContextType | undefined>(undefined);

const formatCurrency = (value: number): string => {
  return `$${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

const formatNumber = (value: number): string => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 });
};

const parseCurrency = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value.replace(/[$,]/g, ''));
};

const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  return parseFloat(value);
};

export const HPMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>({
    acVatops: '$0',
    acVacts: '$0',
    acVactTas: '0',
    acdVatops: '$0',
    acVactsAts: '$0',
    acVactTaAts: '0',
  });
  const [hpap, setHpap] = useState<string>('$0');
  const [email, setEmail] = useState<string>('');
  const [refreshData, setRefreshData] = useState<boolean>(false);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await fetchBitcoinPrice();
      setBitcoinPrice(price);
    };
    fetchPrice();
  }, []);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        if (emailAttribute) {
          setEmail(emailAttribute);
        }
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    fetchEmail();
  }, []);

  const fetchVatopGroups = useCallback(async () => {
    try {
      if (!email) {
        console.warn('No email provided, skipping fetchVatopGroups');
        return;
      }

      console.log('Fetching vatop groups for email:', email);
      const response = await axios.get('/api/fetchVatopGroups', {
        params: { email }
      });
      const fetchedVatopGroups = response.data.vatopGroups || [];
      const updatedVatopGroups = fetchedVatopGroups
        .map((group: VatopGroup) => ({
          ...group,
          cVact: formatCurrency(parseNumber(group.cVactTa) * bitcoinPrice),
          cdVatop: formatCurrency((parseNumber(group.cVactTa) * bitcoinPrice) - parseCurrency(group.cVatop)),
          cVatop: formatCurrency(parseCurrency(group.cVatop)),
          cpVatop: formatCurrency(parseCurrency(group.cpVatop)),
          cVactTa: formatNumber(parseNumber(group.cVactTa))
        }))
        .filter((group: VatopGroup) => parseCurrency(group.cVact) > 0 && parseCurrency(group.cVatop) > 0); // Remove groups with cVact and cVatop both = 0
      setVatopGroups(updatedVatopGroups);
      updateVatopCombinations(updatedVatopGroups);
    } catch (error) {
      console.error('Error fetching vatop groups:', error);
    }
  }, [email, bitcoinPrice]);

  useEffect(() => {
    if (refreshData) {
      fetchVatopGroups();
      setRefreshData(false); // Reset the flag after fetching data
    }
  }, [refreshData, fetchVatopGroups]);

  useEffect(() => {
    const updatedVatopGroups = vatopGroups
      .map(group => ({
        ...group,
        cVact: formatCurrency(parseNumber(group.cVactTa) * bitcoinPrice),
        cdVatop: formatCurrency((parseNumber(group.cVactTa) * bitcoinPrice) - parseCurrency(group.cVatop)),
      }))
      .filter(group => parseCurrency(group.cVact) > 0 && parseCurrency(group.cVatop) > 0); // Remove groups with cVact and cVatop both = 0
    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups);
  }, [bitcoinPrice]);

  useEffect(() => {
    const highestCpVatop = Math.max(...vatopGroups.map(group => parseCurrency(group.cpVatop)), 0);
    if (bitcoinPrice > highestCpVatop) {
      setHpap(formatCurrency(bitcoinPrice));
    } else {
      setHpap(formatCurrency(highestCpVatop));
    }
  }, [vatopGroups, bitcoinPrice]);

  const handleBuy = async (amount: number) => {
    const newVatop: VatopGroup = {
      cVatop: formatCurrency(amount),
      cpVatop: formatCurrency(bitcoinPrice),
      cVact: formatCurrency(amount),
      cVactTa: formatNumber(amount / bitcoinPrice),
      cdVatop: formatCurrency(0),
    };

    const updatedVatopGroups = [...vatopGroups, newVatop];
    setVatopGroups(updatedVatopGroups);
    const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

    try {
      console.log('Attempting to save vatop groups:', updatedVatopGroups);
      await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
      setRefreshData(true); // Set flag to refresh data
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }
  };

  const handleSell = async (amount: number) => {
    if (amount > parseCurrency(vatopCombinations.acVactsAts)) {
      return;
    }

    let remainingAmount = amount;
    const updatedVatopGroups = [...vatopGroups];
    updatedVatopGroups.sort((a, b) => parseCurrency(a.cpVatop) - parseCurrency(b.cpVatop));

    for (let i = 0; i < updatedVatopGroups.length && remainingAmount > 0; i++) {
      const group = updatedVatopGroups[i];
      const sellAmount = Math.min(parseCurrency(group.cVact), remainingAmount);
      remainingAmount -= sellAmount;

      group.cVatop = formatCurrency(parseCurrency(group.cVatop) - sellAmount);
      group.cVact = formatCurrency(parseCurrency(group.cVact) - sellAmount);
      group.cVactTa = formatNumber(parseNumber(group.cVactTa) - (sellAmount / bitcoinPrice));
      group.cdVatop = formatCurrency(parseCurrency(group.cVact) - parseCurrency(group.cVatop));

      if (parseCurrency(group.cVatop) <= 0 && parseCurrency(group.cVact) <= 0) {
        // Find the group with the largest cVactTa
        const largestCactTaGroup = updatedVatopGroups.reduce((maxGroup, currentGroup) => {
          return parseNumber(currentGroup.cVactTa) > parseNumber(maxGroup.cVactTa) ? currentGroup : maxGroup;
        }, updatedVatopGroups[0]);

        // Add cVactTa to the group with the largest cVactTa
        largestCactTaGroup.cVactTa = formatNumber(parseNumber(largestCactTaGroup.cVactTa) + parseNumber(group.cVactTa));

        // Remove the group with cVatop and cVact both = 0
        updatedVatopGroups.splice(i, 1);
        i--; // Adjust index after removal
      }
    }

    setVatopGroups(updatedVatopGroups);
    const updatedVatopCombinations = updateVatopCombinations(updatedVatopGroups);

    try {
      console.log('Attempting to save vatop groups:', updatedVatopGroups);
      await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups, vatopCombinations: updatedVatopCombinations });
      setRefreshData(true); // Set flag to refresh data
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }};

    const updateVatopCombinations = (groups: VatopGroup[]) => {
    const acVatops = groups.reduce((acc, group) => acc + Math.max(parseCurrency(group.cVatop), parseCurrency(group.cVact)), 0);
    const acVacts = groups.reduce((acc, group) => acc + parseCurrency(group.cVact), 0);
    const acVactTas = groups.reduce((acc, group) => acc + parseNumber(group.cVactTa), 0);
    const acdVatops = groups.reduce((acc, group) => {
    return parseCurrency(group.cdVatop) > 0 ? acc + parseCurrency(group.cdVatop) : acc;
    }, 0);

    const acVactsAts = groups.reduce((acc, group) => {
      return parseCurrency(group.cdVatop) > 0 ? acc + parseCurrency(group.cVact) : acc;
    }, 0);
    
    const acVactTaAts = groups.reduce((acc, group) => {
      return parseCurrency(group.cdVatop) > 0 ? acc + parseNumber(group.cVactTa) : acc;
    }, 0);
    
    const updatedCombinations = {
      acVatops: formatCurrency(acVatops),
      acVacts: formatCurrency(acVacts),
      acVactTas: formatNumber(acVactTas),
      acdVatops: formatCurrency(acdVatops > 0 ? acdVatops : 0),
      acVactsAts: formatCurrency(acVactsAts),
      acVactTaAts: formatNumber(acVactTaAts)
    };
    setVatopCombinations(updatedCombinations);
    return updatedCombinations; };

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
  fetchVatopGroups,
  setManualBitcoinPrice: setManualBitcoinPriceApi
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