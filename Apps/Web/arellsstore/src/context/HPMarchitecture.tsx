'use client';

import { useUser } from './UserContext';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';

interface VatopGroup {
  id: string; 
  cVatop: number;
  cpVatop: number;
  cdVatop: number;
  cVact: number;
  cpVact: number;
  cVactTa: number;
  cVactDa: number;
  cVactTaa: number; // Reflects cVactTa if cdVatop > 0, else 0
  HAP: number;
  supplicateWBTCtoUSD: boolean;
}

interface VatopCombinations {
  acVatops: number;
  acVacts: number;
  acVactTas: number;
  acVactDas: number;
  acdVatops: number;
  acVactTaa: number; // Sum of all cVactTaa
}

interface HPMarchitectureType {
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
  toggleSupplicateWBTCtoUSD: (groupId: string, value: boolean) => void; // Updated type

  handleSellConcept: (amount: number) => void;
  setManualBitcoinPriceConcept: (price: number | ((currentPrice: number) => number)) => void;
  setManualBitcoinPrice: (price: number | ((currentPrice: number) => number)) => void;
  soldAmounts: number;
  email: string;
  readABTCFile: () => Promise<number | null>;
  updateABTCFile: (amount: number) => Promise<number>;
}

const HPMarchitecture = createContext<HPMarchitectureType | undefined>(undefined);

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
        console.log("Fetching vatop groups from API...");
    
        // Fetch data from the API
        const response = await axios.get("/api/fetchVatopGroups", { params: { email } });
        console.log("API response:", response.data);
    
        const fetchedVatopGroups = response.data.vatopGroups || [];
        const fetchedVatopCombinations = response.data.vatopCombinations || {};
        const fetchedSoldAmounts = response.data.soldAmounts || 0;
    
        // Recalculate and update vatopGroups
        const updatedVatopGroups = fetchedVatopGroups.map((group: VatopGroup) => {
          const newHAP = Math.max(group.HAP || group.cpVatop, bitcoinPrice);
          const cpVact = group.supplicateWBTCtoUSD ? group.cpVact : newHAP; // Maintain cpVact if supplicateWBTCtoUSD
    
          const cVact = group.cVactTa * cpVact;
    
          // Only recalculate if `supplicateWBTCtoUSD` is false
          const cVactTaa = group.supplicateWBTCtoUSD
            ? group.cVactTaa // Preserve existing value
            : cpVact === bitcoinPrice
            ? group.cVactTa
            : 0;
    
          const cVactDa = group.supplicateWBTCtoUSD
            ? group.cVactDa // Preserve existing value
            : cpVact > bitcoinPrice
            ? cVact
            : 0;
    
          const cdVatop = cVact - group.cVatop;
    
          return {
            ...group,
            HAP: newHAP,
            cpVact: parseFloat(cpVact.toFixed(2)),
            cVact: parseFloat(cVact.toFixed(2)),
            cVactTaa: parseFloat(cVactTaa.toFixed(7)),
            cVactDa: parseFloat(cVactDa.toFixed(2)),
            cdVatop: parseFloat(cdVatop.toFixed(2)),
          };
        });
    
        // Update local state
        setVatopGroups(updatedVatopGroups);
        setVatopCombinations(fetchedVatopCombinations);
        setSoldAmounts(fetchedSoldAmounts);
    
        console.log("Updated vatopGroups in state:", updatedVatopGroups);
    
        // Save updated data to the backend
        const payload = {
          email,
          vatopGroups: updatedVatopGroups,
          vatopCombinations: fetchedVatopCombinations,
          soldAmounts: fetchedSoldAmounts,
        };
    
        console.log("Payload to save:", payload);
    
        const saveResponse = await axios.post("/api/saveVatopGroups", payload);
        console.log("API save response:", saveResponse.data);
      } catch (error) {
        console.error("Error fetching or saving vatop groups:", error);
      }
    };
  
    fetchVatopGroups();
  }, [email, bitcoinPrice]);

  useEffect(() => {
    if (!vatopGroups.length) {
      setHpap(bitcoinPrice); // Default HPAP to current Bitcoin price if no groups exist
      return;
    }
  
    const highestCpVact = Math.max(...vatopGroups.map((group) => group.cpVact || 0));
    setHpap(highestCpVact);
  }, [vatopGroups, bitcoinPrice]); // Depend on vatopGroups and bitcoinPrice



  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
    console.log("Calculating vatopCombinations with groups:", groups);
  
    const combinations = groups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop || 0;
        acc.acVacts += group.cVact || 0;
        acc.acVactTas += group.cVactTa || 0;
        acc.acVactDas += group.cVactDa || 0;
        acc.acdVatops += group.cVact - group.cVatop > 0 ? group.cVact - group.cVatop : 0;
        acc.acVactTaa += group.cVactTaa || 0;
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
  
    console.log("Calculated combinations:", combinations);
  
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




  const updateAllState = async (newBitcoinPrice: number, email: string) => {
    if (!email) {
      console.error("Email is required for updateAllState.");
      return;
    }
  
    console.log("Starting updateAllState...");
    console.log("New Bitcoin Price:", newBitcoinPrice);
  
    // Wait for vatopGroups to be fetched and set
    const currentVatopGroups = [...vatopGroups]; // Create a snapshot of the current state
    console.log("Existing Groups Before Update:", JSON.stringify(currentVatopGroups, null, 2));
  
    // Ensure no intermediate recalculation happens until vatopGroups are fully updated
    const updatedGroups = currentVatopGroups.map((group) => {
      console.log("Processing group:", group.id);
  
      const newHAP = Math.max(group.HAP || group.cpVatop, newBitcoinPrice);
  
      if (group.supplicateWBTCtoUSD) {
        // Skip recalculating `cVactTaa` and `cVactDa` when supplicateWBTCtoUSD is true
        return {
          ...group,
          HAP: newHAP,
          cpVact: group.cpVact,
          cVact: parseFloat((group.cVactTa * group.cpVact).toFixed(2)),
          cVactTaa: group.cVactTaa, // Preserve the existing value
          cVactDa: group.cVactDa,   // Preserve the existing value
          cdVatop: parseFloat((group.cVact - group.cVatop).toFixed(2)),
        };
      }
  
      // Recalculate only if supplicateWBTCtoUSD is false
      const cpVact = newHAP;
      const cVact = group.cVactTa * cpVact;
      const cVactTaa = newBitcoinPrice >= group.cpVatop ? group.cVactTa : 0;
      const cVactDa = newBitcoinPrice < group.cpVatop ? cVact : 0;
      const cdVatop = cVact - group.cVatop;
  
      return {
        ...group,
        HAP: newHAP,
        cpVact: parseFloat(cpVact.toFixed(2)),
        cVact: parseFloat(cVact.toFixed(2)),
        cVactTaa: parseFloat(cVactTaa.toFixed(7)),
        cVactDa: parseFloat(cVactDa.toFixed(2)),
        cdVatop: parseFloat(cdVatop.toFixed(2)),
      };
    });
  
    console.log("Updated Groups After Processing:", JSON.stringify(updatedGroups, null, 2));
  
    // Update state only after all groups are fully processed
    setVatopGroups(updatedGroups);
  
    const newCombinations = updateVatopCombinations(updatedGroups);
    console.log("Updated Combinations:", newCombinations);
  
    // Save updated groups to backend
    try {
      console.log("Saving updated groups via updateAllState...");
      await axios.post("/api/saveVatopGroups", {
        email,
        vatopGroups: updatedGroups,
        vatopCombinations: newCombinations,
        soldAmounts,
      });
      console.log("Successfully saved updated groups.");
    } catch (error) {
      console.error("Error saving updated groups:", error);
    }
  };
  
  const setManualBitcoinPrice = async (
    price: number | ((currentPrice: number) => number)
  ) => {
    const newPrice = typeof price === "function" ? price(bitcoinPrice) : price;
  
    // Set the new Bitcoin price
    setBitcoinPrice(newPrice);
  
    // Call updateAllState with the new price and the existing groups
    console.log("Updating state with new Bitcoin price:", newPrice);
    await updateAllState(newPrice, email);
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
      id: uuidv4(), 
      cVatop: amount,
      cpVatop: bitcoinPrice,
      cVact: amount,
      cpVact: bitcoinPrice,
      cVactTa: amount / bitcoinPrice,
      cVactDa: amount,
      cdVatop: 0,
      cVactTaa: 0,
      HAP: bitcoinPrice,
      supplicateWBTCtoUSD: false,
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
      id: uuidv4(), 
      cVatop: amount,
      cpVatop: bitcoinPrice,
      cVact: amount,
      cpVact: bitcoinPrice,
      cVactTa: amount / bitcoinPrice,
      cVactDa: amount,
      cdVatop: 0,
      cVactTaa: 0,
      HAP: bitcoinPrice,
      supplicateWBTCtoUSD: false,
    };
  
    const updatedVatopGroups = [...vatopGroups, newVatop];
    await updateAllState(bitcoinPrice, email);
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
          id: uuidv4(),
          cVatop: amountToImport * currentPrice,
          cpVatop: currentPrice,
          cVact: amountToImport * currentPrice,
          cpVact: currentPrice,
          cVactTa: amountToImport,
          cVactDa: 0,
          cdVatop: 0,
          cVactTaa: amountToImport,
          HAP: currentPrice,
          supplicateWBTCtoUSD: false,
        };
  
        const updatedVatopGroups = [...vatopGroups, newGroup];
  
        setVatopGroups(updatedVatopGroups);
        const newCombinations = updateVatopCombinations(updatedVatopGroups);
        setVatopCombinations(newCombinations);
  
        // Save new group data to backend
        try {
          console.log("Saving new group via handleImport...");
          await axios.post("/api/saveVatopGroups", {
            email,
            vatopGroups: updatedVatopGroups,
            vatopCombinations: newCombinations,
            soldAmounts,
          });
        } catch (error) {
          console.error("Error saving new group:", error);
        }
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
          cdVatop: parseFloat((group.cVact - group.cVatop).toFixed(2)), 
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

  const toggleSupplicateWBTCtoUSD = (groupId: string, value: boolean) => {
    setVatopGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, supplicateWBTCtoUSD: value } : group
      )
    );
  };






  return (
    <HPMarchitecture.Provider
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
        toggleSupplicateWBTCtoUSD, 
        email,
        soldAmounts,
        readABTCFile, 
        updateABTCFile
      }}
    >
      {children}
    </HPMarchitecture.Provider>
  );
};

export const useHPM = () => {
  const context = useContext(HPMarchitecture);
  if (context === undefined) {
    throw new Error('useHPM must be used within an HPMProvider');
  }
  return context;
};