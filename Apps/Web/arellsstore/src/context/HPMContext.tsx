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
  soldAmount: number;
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
  const [soldAmount, setSoldAmount] = useState<number>(0);

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
  
        setVatopGroups(fetchedVatopGroups);
        setVatopCombinations(fetchedVatopCombinations);
  
        // Calculate the highest cpVact
        const maxCpVact = Math.max(...fetchedVatopGroups.map((group: { cpVact: any; }) => group.cpVact || 0));
        setHpap(maxCpVact);
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };
  
    fetchVatopGroups();
  }, [email]);

  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
    const combinations = groups.reduce(
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
      }
    );

    console.log("Updated vatopCombinations:", combinations); 
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
    console.log("Updated vatopGroups after recalculation:", updatedVatopGroups);
  }, [vatopUpdateTrigger]); 
  useEffect(() => {
    const interval = setInterval(() => {
      // Find the highest cpVact across groups
      const highestCpVact = Math.max(...vatopGroups.map((group) => group.cpVact || 0), 0);
  
      // If no cpVact exists (highestCpVact is 0), fall back to bitcoinPrice
      const updatedHpap = highestCpVact > 0 ? highestCpVact : bitcoinPrice;
  
      setHpap(updatedHpap);
      console.log("Updated hpap:", updatedHpap);
    }, 3000); // Run every 3 seconds
  
    return () => clearInterval(interval); // Clean up interval on unmount
  }, [vatopGroups, bitcoinPrice]); // Depend on vatopGroups and bitcoinPrice
  
  const updateAllState = async (
    newBitcoinPrice: number,
    updatedGroups: VatopGroup[],
    email: string
  ) => {
    const epsilon = 0.0001; // Minimal value for numerical stability
  
    const processedGroups = updatedGroups.map((group) => {
      const newHAP = Math.max(group.HAP || group.cpVatop, newBitcoinPrice);
      const newCpVact = Math.max(newHAP, group.cpVact); // Ensure cpVact only increases
      const newCVact = group.cVactTa * newCpVact; // Calculate cVact based on cpVact
      const newCdVatop = group.cVactTa * (newCpVact - group.cpVatop); // Calculate cdVatop
      const newCVactDa =
        newBitcoinPrice >= newCpVact
          ? 0 // Set cVactDa to 0 if Bitcoin price >= cpVact
          : newCVact; // Otherwise, match cVact
      
      const newCVactTaa = 
        newBitcoinPrice < newCpVact 
          ? 0 // Set cVactTaa to 0 if Bitcoin price < cpVact
          : group.cVactTa; // Otherwise, match cVactTa
  
      return {
        ...group,
        HAP: newHAP,
        cpVact: parseFloat(newCpVact.toFixed(2)),
        cVact: parseFloat(newCVact.toFixed(2)),
        cVactDa: parseFloat(newCVactDa.toFixed(2)),
        cVactTaa: parseFloat(newCVactTaa.toFixed(7)), // Reflect updated cVactTaa
        cdVatop: parseFloat(newCdVatop.toFixed(2)),
      };
    });
  
    // Filter valid groups (non-trivial values)
    const retainedGroups = processedGroups.filter(
      (group) => group.cVact > epsilon || group.cVactTa > epsilon || group.cVatop > epsilon
    );
  
    // Aggregate combinations
    const newVatopCombinations = retainedGroups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop;
        acc.acVacts += group.cVact;
        acc.acVactTas += group.cVactTa;
        acc.acVactDas += group.cVactDa;
        acc.acdVatops += group.cdVatop > 0 ? group.cdVatop : 0;
        acc.acVactTaa += group.cVactTaa; // Aggregate cVactTaa
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactTas: 0,
        acVactDas: 0,
        acdVatops: 0,
        acVactTaa: 0, // Initialize acVactTaa
      }
    );
  
    // Update state
    setVatopGroups(retainedGroups);
    setVatopCombinations(newVatopCombinations);
  
    // Ensure hpap stability
    const maxCpVact = Math.max(...retainedGroups.map((group) => group.cpVact), newBitcoinPrice);
    setHpap(maxCpVact);
  
    // Prepare and send payload
    const payload = {
      email,
      vatopGroups: retainedGroups,
      vatopCombinations: newVatopCombinations,
    };
  
    try {
      const response = await axios.post("/api/saveVatopGroups", payload);
      console.log("Response from server:", response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error saving vatop groups:", error.response?.data || error.message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };
  const setManualBitcoinPrice = async (
    price: number | ((currentPrice: number) => number)
  ) => {
    const newPrice = typeof price === "function" ? price(bitcoinPrice) : price;
  
    const updatedGroups = vatopGroups.map((group) => {
      const newHAP = Math.max(group.HAP || group.cpVatop, newPrice);
      const newCpVact = Math.max(newHAP, group.cpVact); // Preserve or update cpVact
      const newCVact = group.cVactTa * newCpVact; // cVact reflects cpVact
      const newCVactDa = newPrice <= newCpVact ? newCVact : 0; // cVactDa logic
      const newCdVatop = group.cVactTa * (newCpVact - group.cpVatop); // cdVatop logic
  
      return {
        ...group,
        HAP: newHAP,
        cpVact: parseFloat(newCpVact.toFixed(2)),
        cVact: parseFloat(newCVact.toFixed(2)),
        cVactDa: parseFloat(newCVactDa.toFixed(2)),
        cdVatop: parseFloat(newCdVatop.toFixed(2)),
      };
    });
  
    console.log("Updated Groups Before Saving:", updatedGroups);
  
    await updateAllState(newPrice, updatedGroups, email);
  
    setBitcoinPrice(newPrice);
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
      console.log('Successfully updated aBTC.json with adjustment:', amount);
  
      // Return the updated aBTC value from the server response
      return response.data.aBTC;
    } catch (error) {
      console.error('Error updating aBTC.json:', error);
      throw error;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      readABTCFile();
      handleImport();
    }, 3000);
  
    return () => clearInterval(interval);
  }, [vatopCombinations, email]);



















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
  // Automatically process import if aBTC > acVactTas
  const handleImport = async () => {
    if (isUpdating) {
      console.log("Another operation is in progress. Aborting import.");
      return;
    }
  
    isUpdating = true;
  
    try {
      const aBTC = await readABTCFile();
      console.log("aBTC in import:", aBTC);
  
      if (aBTC === null) {
        console.error("Invalid state: aBTC is null.");
        return;
      }
  
      const acVactTas = vatopCombinations.acVactTas || 0;
  
      if (aBTC > acVactTas) {
        const amountToImport = parseFloat((aBTC - acVactTas).toFixed(8));
        console.log(`Importing amount: ${amountToImport} BTC`);
  
        const newGroup = {
          cVatop: amountToImport * bitcoinPrice,
          cpVatop: bitcoinPrice,
          cVact: amountToImport * bitcoinPrice,
          cpVact: bitcoinPrice,
          cVactTa: amountToImport,
          cVactDa: amountToImport * bitcoinPrice,
          cdVatop: 0,
          cVactTaa: 0,
          HAP: bitcoinPrice,
        };
  
        const updatedVatopGroups = [...vatopGroups, newGroup];
        await updateAllState(bitcoinPrice, updatedVatopGroups, email);
  
        console.log("Updated vatopGroups after import:", updatedVatopGroups);
  
        // Force synchronization of aBTC
        setVatopCombinations((prev) => ({
          ...prev,
          acVactTas: aBTC,
        }));
      } else {
        console.log(
          `No import needed: aBTC (${aBTC.toFixed(8)}) is less than or equal to acVactTas (${acVactTas.toFixed(8)}).`
        );
      }
    } catch (error) {
      console.error("Error during handleImport:", error);
    } finally {
      isUpdating = false;
    }
  };
  

  const handleSell = async (amount: number) => {
    if (isUpdating) {
      console.log("Another operation is in progress. Aborting sell.");
      return;
    }
  
    isUpdating = true;
  
    try {
      const btcAmount = parseFloat((amount / bitcoinPrice).toFixed(8));
      console.log(`Sell Amount (BTC): ${btcAmount}`);
  
      const currentABTC = await readABTCFile();
      if (currentABTC === null) {
        console.error("Unable to fetch aBTC for the user.");
        return;
      }
  
      console.log(`Available aBTC: ${currentABTC}`);
      if (btcAmount > currentABTC) {
        alert(
          `Insufficient aBTC! You tried to sell ${btcAmount} BTC, but only ${currentABTC} BTC is available.`
        );
        return;
      }
  
      const newABTC = await updateABTCFile(-btcAmount);
      console.log("Updated aBTC after selling:", newABTC);
  
      // Explicitly synchronize state immediately
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
          cdVatop: Math.max(group.cVactTa * (group.cpVact - group.cpVatop), 0),
          cVactTaa: group.cVactTaa > 0 ? Math.max(group.cVactTa - sellBTC, 0) : 0,
        };
      });
  
      const retainedGroups = updatedVatopGroups.filter(
        (group) => group.cVatop > 0 || group.cVact > 0 || group.cVactTa > 0
      );
  
      setVatopGroups(retainedGroups);
      updateVatopCombinations(retainedGroups);
      setSoldAmount((prev) => prev + amount);
  
      console.log("Sell operation completed successfully.");
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
        soldAmount,
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