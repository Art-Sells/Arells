'use client';

import { useUser } from '../context/UserContext';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';

interface VatopGroup {
  cVatop: number;
  cpVatop: number;
  cdVatop: number;
  cVact: number;
  cpVact: number;
  cVactTa: number;
  cVactDa: number;
  cVactTaa: number; // Reflects cVactTa if cdVatop > 0, else 0
  HAP: number;
}

interface VatopCombinations {
  acVatops: number;
  acVacts: number;
  acVactTas: number;
  acVactDas: number;
  acdVatops: number;
  acVactTaa: number; // Sum of all cVactTaa
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
  handleImportABTC: (amount: number) => void;
  handleSell: (amount: number) => void;
  handleBuyConcept: (amount: number) => void;
  handleSellConcept: (amount: number) => void;
  setManualBitcoinPriceConcept: (price: number | ((currentPrice: number) => number)) => void;
  setManualBitcoinPrice: (price: number | ((currentPrice: number) => number)) => void;
  soldAmounts: number;
  email: string;
  readABTCFile: () => Promise<number | null>;
  updateABTCFile: (amount: number) => Promise<number>;
}

const HPMContext = createContext<HPMContextType | undefined>(undefined);

export const HPMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string>('');
  const [refreshData, setRefreshData] = useState<boolean>(false);
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(60000);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [vatopUpdateTrigger, setVatopUpdateTrigger] = useState(false);
  
  const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>({
    acVatops: 0,
    acVacts: 0,
    acVactTas: 0,
    acVactDas: 0,
    acdVatops: 0,
    acVactTaa: 0,
  });

  const [hpap, setHpap] = useState<number>(60000);
  const [soldAmounts, setSoldAmounts] = useState<number>(0);

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


  useEffect(() => {
    const fetchVatopGroups = async () => {
      try {
        if (!email) {
          console.warn('No email provided, skipping fetchVatopGroups');
          return;
        }
  
        const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
        const fetchedVatopGroups = response.data.vatopGroups || [];
        const fetchedVatopCombinations = response.data.vatopCombinations || {};
        const fetchedSoldAmounts = response.data.soldAmounts || 0; // Fetch soldAmounts
  
        // Ensure no duplicate or redundant groups
        const uniqueVatopGroups = fetchedVatopGroups.filter(
          (group: VatopGroup, index: number, self: VatopGroup[]) =>
            index === self.findIndex((g) => g.cpVatop === group.cpVatop && g.cVactTa === group.cVactTa)
        );
  
        setVatopGroups(uniqueVatopGroups); // Set only unique groups
        setVatopCombinations(fetchedVatopCombinations);
        setSoldAmounts(fetchedSoldAmounts); // Set soldAmounts
  
        // Recalculate HPAP
        const maxCpVact = Math.max(...uniqueVatopGroups.map((group: { cpVact: any; }) => group.cpVact || 0));
        setHpap(maxCpVact);
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };
  
    fetchVatopGroups();
  }, [email]);

  useEffect(() => {
    if (!vatopGroups.length) {
      setHpap(bitcoinPrice); // Default HPAP to current Bitcoin price if no groups exist
      return;
    }
  
    const highestCpVact = Math.max(...vatopGroups.map((group) => group.cpVact || 0));
    setHpap(highestCpVact);
  }, [vatopGroups, bitcoinPrice]); // Depend on vatopGroups and bitcoinPrice

  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
    const combinations = groups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop;
        acc.acVacts += group.cVact;
        acc.acVactTas += group.cVactTa;
        acc.acVactDas += group.cVactDa;
        acc.acdVatops += group.cVact - group.cVatop > 0 ? group.cVact - group.cVatop : 0;
        acc.acVactTaa += group.cVactTaa; // Sum all cVactTaa
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactTas: 0,
        acVactDas: 0,
        acdVatops: 0,
        acVactTaa: 0, // Initialize as 0
      }
    );
  
    setVatopCombinations(combinations);
    return combinations;
  };
  

  useEffect(() => {
    if (!vatopUpdateTrigger) return; // Only run if triggered
  
    const updatedVatopGroups = vatopGroups
      .map((group) => ({
        ...group,
        cVact: group.cVactTa * group.cpVact, // Reflect cpVact in cVact
        cdVatop: group.cVactTa * (group.cpVact - group.cpVatop), // Use cpVact - cpVatop
      }))
      .filter((group) => group.cVact > 0); // Filter valid groups
  
    setVatopGroups(updatedVatopGroups);
    updateVatopCombinations(updatedVatopGroups); // Update combinations
    setVatopUpdateTrigger(false); // Reset the trigger
  }, [vatopUpdateTrigger]); 
  useEffect(() => {
    if (!vatopGroups.length) {
      setHpap(bitcoinPrice); // Default HPAP to current Bitcoin price if no groups exist
      return;
    }
  
    const highestCpVact = Math.max(...vatopGroups.map((group) => group.cpVact || 0));
    setHpap(highestCpVact);
  }, [vatopGroups, bitcoinPrice]); // Depend on vatopGroups and bitcoinPrice
  const filterEmptyGroupsAndUpdateHPAP = (groups: VatopGroup[]): VatopGroup[] => {
    // Filter out groups where cVact <= 0 or cVatop <= 0
    const filteredGroups = groups.filter(
      (group) => group.cVact > 0 && group.cVatop > 0
    );
  
    // Update HPAP based on the remaining groups
    if (filteredGroups.length > 0) {
      const highestCpVact = Math.max(...filteredGroups.map((group) => group.cpVact || 0));
      setHpap(highestCpVact);
    } else {
      setHpap(bitcoinPrice); // Fallback to bitcoinPrice if no valid groups
    }
  
    return filteredGroups;
  };
  const recalculateCdVatop = (groups: VatopGroup[]): VatopGroup[] => {
    return groups.map((group) => ({
      ...group,
      cdVatop: parseFloat((group.cVact - group.cVatop).toFixed(2)), // Recalculate cdVatop
    }));
  };




const updateAllState = async (
  newBitcoinPrice: number,
  updatedGroups: VatopGroup[],
  email: string
) => {
  const processedGroups = updatedGroups.map((group) => {
    const newCpVact = Math.max(group.cpVact, newBitcoinPrice);
    const newCVact = group.cVactTa * newCpVact;
    const newCVactTaa = newBitcoinPrice >= newCpVact ? group.cVactTa : 0;
    const newCVactDa = newBitcoinPrice < newCpVact ? newCVact : 0;

    return {
      ...group,
      cpVact: newCpVact,
      cVact: parseFloat(newCVact.toFixed(2)),
      cVactTaa: parseFloat(newCVactTaa.toFixed(7)),
      cVactDa: parseFloat(newCVactDa.toFixed(2)),
      cdVatop: parseFloat((newCVact - group.cVatop).toFixed(2)),
    };
  });

  const filteredGroups = filterEmptyGroupsAndUpdateHPAP(processedGroups);

  setVatopGroups(filteredGroups);

  const newCombinations = updateVatopCombinations(filteredGroups);

  try {
    await axios.post('/api/saveVatopGroups', {
      email,
      vatopGroups: filteredGroups,
      vatopCombinations: newCombinations,
    });
  } catch (error) {
    console.error("Error saving vatopGroups:", error);
  }
};




  const setManualBitcoinPrice = async (
    price: number | ((currentPrice: number) => number)
  ) => {
    const newPrice = typeof price === "function" ? price(bitcoinPrice) : price;
  
    setBitcoinPrice(newPrice); // Update the state immediately
  
    const updatedGroups = vatopGroups.map((group) => {
      const newCpVact = Math.max(group.cpVact, newPrice); // Ensure cpVact only increases
      const newCVact = group.cVactTa * newCpVact; // Update cVact
      const newCVactTaa = newPrice >= newCpVact ? group.cVactTa : 0; // cVactTaa logic
      const newCVactDa = newPrice < newCpVact ? newCVact : 0; // cVactDa logic
      const newCdVatop = newCVact - group.cVatop; // Recalculate cdVatop
  
      return {
        ...group,
        cpVact: parseFloat(newCpVact.toFixed(2)),
        cVact: parseFloat(newCVact.toFixed(2)),
        cVactTaa: parseFloat(newCVactTaa.toFixed(7)),
        cVactDa: parseFloat(newCVactDa.toFixed(2)),
        cdVatop: parseFloat(newCdVatop.toFixed(2)),
      };
    });
  
    await updateAllState(newPrice, updatedGroups, email); // Ensure downstream updates happen after the price is set
  };
  const readABTCFile = async (): Promise<number | null> => {
    try {
      if (!email) throw new Error("Email is not set in context.");
      
      const response = await axios.get('/api/readABTC', { params: { email } });
      return response.data.aBTC || 0;
    } catch (error) {
      console.error('Error reading aBTC.json:', error);
      return null;
    }
  };

  const updateABTCFile = async (amount: number): Promise<number> => {
    try {
      if (!email) throw new Error("Email is not set in context.");
      
      const response = await axios.post('/api/saveABTC', { email, amount });
  
      // Return the updated aBTC value from the server response
      return response.data.aBTC;
    } catch (error) {
      console.error('Error updating aBTC.json:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isSyncing = false; // Add a lock to prevent overlapping updates
  
    const interval = setInterval(async () => {
      if (isSyncing) return; // Prevent concurrent updates
  
      isSyncing = true;
  
      try {
        // Fetch and import data only when necessary
        await readABTCFile(); // Fetch the current aBTC (if needed for internal use)
        await handleImport(); // Call handleImport to sync
      } catch (error) {
        console.error("Error in interval execution:", error);
      } finally {
        isSyncing = false; // Release lock
      }
    }, 3000); // Run every 3 seconds
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, [vatopCombinations, email]); // Ensure dependencies include relevant state


















  const updateAllStateConcept = (newBitcoinPrice: number, updatedGroups: VatopGroup[]) => {
    const epsilon = 0.0001;

    const processedGroups = updatedGroups.map((group) => {
      const newHighestPrice = Math.max(group.HAP || group.cpVatop, newBitcoinPrice);
      const newCpVact = newHighestPrice;
      const newCVact = group.cVactTa * newCpVact;
      const newCVactDa = newBitcoinPrice > 0 && newBitcoinPrice <= group.cpVatop ? newCVact : 0;

      return {
        ...group,
        HAP: newHighestPrice,
        cpVact: parseFloat(newCpVact.toFixed(2)),
        cVact: parseFloat(Math.max(newCVact, 0).toFixed(2)),
        cVactDa: parseFloat(newCVactDa.toFixed(2)),
        cVactTa: parseFloat(group.cVactTa.toFixed(7)),
        cdVatop: parseFloat((group.cVactTa * (newCpVact - group.cpVatop)).toFixed(2)),
        cVatop: parseFloat(group.cVatop.toFixed(2)),
      };
    });

    const retainedGroups = processedGroups.filter(
      (group) =>
        group.cVact > epsilon || group.cVactTa > epsilon || group.cVatop > epsilon
    );

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
        acVactTaa: 0,
      } as VatopCombinations
    );

    setVatopGroups(retainedGroups);
    setVatopCombinations({
      acVatops: parseFloat(newVatopCombinations.acVatops.toFixed(2)),
      acVacts: parseFloat(newVatopCombinations.acVacts.toFixed(2)),
      acVactTas: parseFloat(newVatopCombinations.acVactTas.toFixed(7)),
      acVactDas: parseFloat(newVatopCombinations.acVactDas.toFixed(2)),
      acdVatops: parseFloat(newVatopCombinations.acdVatops.toFixed(2)),
      acVactTaa: parseFloat(newVatopCombinations.acVactTaa.toFixed(7))
    });

    if (retainedGroups.length > 0) {
      const maxCpVatop = Math.max(...retainedGroups.map((group) => group.cpVatop));
      const maxCpVact = Math.max(...retainedGroups.map((group) => group.cpVact));
      setHpap(maxCpVact > maxCpVatop ? maxCpVact : maxCpVatop);
    } else {
      setHpap(newBitcoinPrice);
    }

    return newVatopCombinations;
  };
  const setManualBitcoinPriceConcept = (price: number | ((currentPrice: number) => number)) => {
    setBitcoinPrice((currentPrice) => {
      const newPrice = typeof price === 'function' ? price(currentPrice) : price;

      const updatedGroups = vatopGroups.map((group) => ({
        ...group,
        HAP: Math.max(group.HAP || group.cpVatop, newPrice),
        cVact: group.cVactTa * Math.max(newPrice, hpap),
        cdVatop: group.cVactTa * (Math.max(newPrice, hpap) - group.cpVatop),
      }));

      updateAllStateConcept(newPrice, updatedGroups);
      return newPrice;
    });
  };

  const handleBuyConcept = (amount: number) => {
    if (amount <= 0) return;

    const newVatop: VatopGroup = {
      cVatop: amount,
      cpVatop: bitcoinPrice,
      cVact: amount,
      cpVact: bitcoinPrice,
      cVactTa: amount / bitcoinPrice,
      cVactDa: amount,
      cdVatop: 0,
      cVactTaa: 0,
      HAP: bitcoinPrice,
    };

    const updatedGroups = [...vatopGroups, newVatop];
    updateAllStateConcept(bitcoinPrice, updatedGroups);
  };

  const handleSellConcept = (amount: number) => {
    if (amount <= 0 || vatopCombinations.acVacts <= 0) return;

    let remainingAmount = amount;

    const updatedGroups = vatopGroups.map((group) => {
      if (remainingAmount <= 0) return group;

      const sellAmount = Math.min(group.cVact, remainingAmount);
      remainingAmount -= sellAmount;

      return {
        ...group,
        cVatop: Math.max(group.cVatop - sellAmount, 0),
        cVact: Math.max(group.cVact - sellAmount, 0),
        cVactTa: Math.max(group.cVactTa - sellAmount / group.cpVact, 0),
        cdVatop: Math.max(group.cVactTa * (group.cpVact - group.cpVatop), 0),
      };
    });

    const retainedGroups = updatedGroups.filter(
      (group) => group.cVatop > 0 || group.cVact > 0 || group.cVactTa > 0
    );

    updateAllStateConcept(bitcoinPrice, retainedGroups);
  };
















  

  const handleBuy = async (amount: number) => {
    if (amount <= 0) return;
  
    const newVatop: VatopGroup = {
      cVatop: amount,
      cpVatop: bitcoinPrice,
      cVact: amount,
      cpVact: bitcoinPrice,
      cVactTa: amount / bitcoinPrice,
      cVactDa: amount,
      cdVatop: 0,
      cVactTaa: 0,
      HAP: bitcoinPrice,
    };
  
    const updatedVatopGroups = [...vatopGroups, newVatop];
    await updateAllState(bitcoinPrice, updatedVatopGroups, email);
  };
  const handleImportABTC = async (amount: number) => {
    if (amount < 0.0001) {
      alert('The minimum import amount is 0.0001 BTC.');
      return;
    }
    try {
      await axios.post('/api/saveABTC', { email, amount });
    } catch (error) {
      console.error('Error saving to aBTC.json:', error);
    }
  };
  let isUpdating = false; // Shared lock variable
  
  const handleImport = async () => {
    if (isUpdating) {
      return;
    }
  
    isUpdating = true;
  
    try {
      const aBTC = await readABTCFile(); // Fetch the current aBTC value
  
      if (aBTC === null) {
        console.error("Invalid state: aBTC is null.");
        return;
      }
  
      const acVactTas = vatopCombinations.acVactTas || 0;
  
      if (aBTC - acVactTas < 0.00001) {
        return;
      }
  
      if (aBTC > acVactTas) {
        const amountToImport = parseFloat((aBTC - acVactTas).toFixed(8));
  
        const currentPrice = bitcoinPrice;

        const newGroup = {
          cVatop: amountToImport * currentPrice,
          cpVatop: currentPrice,
          cVact: amountToImport * currentPrice,
          cpVact: currentPrice,
          cVactTa: amountToImport,
          cVactDa: amountToImport * currentPrice,
          cdVatop: 0,
          cVactTaa: 0,
          HAP: currentPrice,
        };
  
        const updatedVatopGroups = [...vatopGroups, newGroup];
        await updateAllState(currentPrice, updatedVatopGroups, email);

        setVatopCombinations((prev) => ({
          ...prev,
          acVactTas: aBTC,
        }));
      } else {
        // console.log(
        //   `No import needed: aBTC (${aBTC.toFixed(8)}) is less than or equal to acVactTas (${acVactTas.toFixed(8)}).`
        // );
      }
    } catch (error) {
      console.error("Error during handleImport:", error);
    } finally {
      isUpdating = false;
    }
  };
  
  const saveVatopGroups = async ({
    email,
    vatopGroups,
    vatopCombinations,
    soldAmounts,
  }: {
    email: string;
    vatopGroups: VatopGroup[];
    vatopCombinations: VatopCombinations;
    soldAmounts: number;
  }) => {
    try {
      const payload = {
        email,
        vatopGroups,
        vatopCombinations,
        soldAmounts, // Updated field
      };
  
      const response = await axios.post('/api/saveVatopGroups', payload);
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }
  };
  const handleSell = async (amount: number) => {
    if (isUpdating) return;
  
    isUpdating = true;
  
    try {
      const btcAmount = parseFloat((amount / bitcoinPrice).toFixed(8));
  
      if (amount > vatopCombinations.acVacts) {
        alert(`Insufficient BTC! You tried to sell $${amount}, but only $${vatopCombinations.acVacts} is available.`);
        return;
      }
  
      const newABTC = await updateABTCFile(-btcAmount);
  
      setVatopCombinations((prev) => ({
        ...prev,
        acVactTas: newABTC,
      }));
  
      let remainingBTC = btcAmount;
      const updatedVatopGroups = vatopGroups.map((group) => {
        if (remainingBTC <= 0) return group;
  
        const sellBTC = Math.min(group.cVactTa, remainingBTC);
        remainingBTC -= sellBTC;
  
        return {
          ...group,
          cVatop: Math.max(group.cVatop - sellBTC * group.cpVatop, 0),
          cVact: Math.max(group.cVact - sellBTC * group.cpVact, 0),
          cVactTa: Math.max(group.cVactTa - sellBTC, 0),
          cVactDa: Math.max(group.cVactDa - sellBTC * group.cpVact, 0),
          cVactTaa: group.cVactTaa > 0 ? Math.max(group.cVactTa - sellBTC, 0) : 0,
        };
      });
  
      const filteredGroups = updatedVatopGroups.filter((group) => group.cVact > 0);
  
      setVatopGroups(filteredGroups);
  
      const newVatopCombinations = updateVatopCombinations(filteredGroups);
      setSoldAmounts((prev) => prev + amount);
  
      await saveVatopGroups({
        email,
        vatopGroups: filteredGroups,
        vatopCombinations: newVatopCombinations,
        soldAmounts,
      });
    } catch (error) {
      console.error("Error during sell operation:", error);
    } finally {
      isUpdating = false;
    }
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
        handleImportABTC,
        handleSell,
        handleBuyConcept,
        handleSellConcept,
        setManualBitcoinPriceConcept,
        setManualBitcoinPrice,
        email,
        soldAmounts,
        readABTCFile, 
        updateABTCFile
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