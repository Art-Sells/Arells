'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';

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
  fetchVatopGroups: () => void;
  setManualBitcoinPrice: (price: number) => void;
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
      setVatopGroups(response.data.vatopGroups || []);
    } catch (error) {
      console.error('Error fetching vatop groups:', error);
    }
  }, [email]);

  useEffect(() => {
    if (refreshData) {
      fetchVatopGroups();
      setRefreshData(false); // Reset the flag after fetching data
    }
  }, [refreshData, fetchVatopGroups]);

  useEffect(() => {
    const updatedVatopGroups = vatopGroups.map(group => ({
      ...group,
      cVact: group.cVactTa * bitcoinPrice,
      cdVatop: (group.cVactTa * bitcoinPrice) - group.cVatop,
    }));
    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups);
  }, [bitcoinPrice]);

  useEffect(() => {
    const highestCpVatop = Math.max(...vatopGroups.map(group => group.cpVatop), 0);
    if (bitcoinPrice > highestCpVatop) {
      setHpap(bitcoinPrice);
    } else {
      setHpap(highestCpVatop);
    }
  }, [vatopGroups, bitcoinPrice]);

  const handleBuy = async (amount: number) => {
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

    try {
      console.log('Attempting to save vatop groups:', updatedVatopGroups);
      await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups });
      setRefreshData(true); // Set flag to refresh data
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }
  };

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

      if (group.cVatop <= 0) {
        group.cVatop = 0;
      }

      if (group.cVact <= 0) {
        group.cVact = 0;
        group.cVactTa = 0;
        group.cdVatop = 0;
        updatedVatopGroups.splice(i, 1);
        i--; // Adjust index after removal
      }
    }

    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups);

    try {
      console.log('Attempting to save vatop groups:', updatedVatopGroups);
      await axios.post('/api/saveVatopGroups', { email, vatopGroups: updatedVatopGroups });
      setRefreshData(true); // Set flag to refresh data
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }
  };

  const updateVatopCombinations = (groups: VatopGroup[]) => {
    const acVatops = groups.reduce((acc, group) => acc + group.cVatop, 0);
    const acVacts = groups.reduce((acc, group) => acc + group.cVact, 0);
    const acVactTas = groups.reduce((acc, group) => acc + group.cVactTa, 0);
    const acdVatops = groups.reduce((acc, group) => {
      return group.cdVatop > 0 ? acc + group.cdVatop : acc;
    }, 0);

    const acVactsAts = groups.reduce((acc, group) => {
      return group.cdVatop > 0 ? acc + group.cVact : acc;
    }, 0);

    const acVactTaAts = groups.reduce((acc, group) => {
      return group.cdVatop > 0 ? acc + group.cVactTa : acc;
    }, 0);

    setVatopCombinations({ acVatops, acVacts, acVactTas, acdVatops: acdVatops > 0 ? acdVatops : 0, acVactsAts, acVactTaAts });
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