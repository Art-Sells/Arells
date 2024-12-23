'use client';

import { useUser } from './UserContext';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchBitcoinPrice } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';
import { useSigner } from '../state/signer'; 

interface VatopGroup {
  id: string; 
  cVatop: number;
  cpVatop: number;
  cdVatop: number;
  cVact: number;
  cpVact: number;
  cVactDat: number;
  cVactDa: number;
  cVactTaa: number; // Reflects cVactDat / bitcoinPrice
  HAP: number;
  supplicateWBTCtoUSD: boolean;
  supplicateUSDtoWBTC: boolean;
}

interface VatopCombinations {
  acVatops: number;
  acVacts: number;
  acVactDat: number;
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
    const {
      MASSaddress,
      MASSsupplicationAddress,
      balances,
    } = useSigner();

  const [email, setEmail] = useState<string>('');
  const [refreshData, setRefreshData] = useState<boolean>(false);
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [vatopUpdateTrigger, setVatopUpdateTrigger] = useState(false);
  
  const [vatopCombinations, setVatopCombinations] = useState<VatopCombinations>({
    acVatops: 0.00,
    acVacts: 0.00,
    acVactDat: 0.00,
    acVactDas: 0.00,
    acdVatops: 0.00,
    acVactTaa: 0.00000000,
  });

  const [hpap, setHpap] = useState<number>(bitcoinPrice);
  const [soldAmounts, setSoldAmounts] = useState<number>(0);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await fetchBitcoinPrice();
        setBitcoinPrice(price);
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
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


  useEffect(() => {
    const fetchVatopGroups = async () => {
      try {
        console.log("Fetching vatop groups from API...");
    
        // Fetch data from the API
        const response = await axios.get("/api/fetchVatopGroups", { params: { email } });
        console.log("API response:", response.data);
    
        const fetchedVatopGroups = response.data.vatopGroups || [];
        const fetchedSoldAmounts = response.data.soldAmounts || 0;
    
        // Update existing groups only
        const updatedVatopGroups = vatopGroups.map((existingGroup) => {
          const fetchedGroup = fetchedVatopGroups.find((fg: { id: string; }) => fg.id === existingGroup.id);
    
          if (!fetchedGroup) {
            // If no fetched group matches the existing one, preserve the current state
            console.warn(`Group with ID ${existingGroup.id} not found in fetchedVatopGroups. Preserving existing group.`);
            return existingGroup;
          }
    
          // Update the existing group with new values
          const newHAP = Math.max(fetchedGroup.HAP || fetchedGroup.cpVatop, bitcoinPrice);
          const cpVact =
            (fetchedGroup.supplicateWBTCtoUSD === false && fetchedGroup.supplicateUSDtoWBTC === false) ||
            (fetchedGroup.supplicateWBTCtoUSD === false && fetchedGroup.supplicateUSDtoWBTC === true)
              ? newHAP
              : fetchedGroup.cpVact;
    
          const cVactDat = parseFloat((fetchedGroup.cVactTaa * bitcoinPrice + fetchedGroup.cVactDa).toFixed(2));
          const cVact = cVactDat;
    
          const cVactTaa = fetchedGroup.supplicateWBTCtoUSD
            ? fetchedGroup.cVactTaa
            : cpVact === bitcoinPrice
            ? cVactDat / bitcoinPrice
            : 0;
    
          const cVactDa = fetchedGroup.supplicateWBTCtoUSD
            ? fetchedGroup.cVactDa
            : cpVact > bitcoinPrice
            ? cVact
            : 0;
    
          const cdVatop = parseFloat((cVact - fetchedGroup.cVatop).toFixed(2));
    
          return {
            ...existingGroup,
            HAP: newHAP,
            cpVact,
            cVact,
            cVactDat,
            cVactTaa,
            cVactDa,
            cdVatop,
          };
        });
    
        console.log("Updated Groups After Processing:", JSON.stringify(updatedVatopGroups, null, 2));
    
        // Update vatopGroups and vatopCombinations
        updateVatopGroupsAndCombinations(updatedVatopGroups);
        setSoldAmounts(fetchedSoldAmounts);
    
        console.log("Updated vatopGroups in state:", updatedVatopGroups);
    
        // Save updated data to the backend
        const payload = {
          email,
          vatopGroups: updatedVatopGroups,
          vatopCombinations,
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
        acc.acVactDat += group.cVactDat || 0;
        acc.acVactDas += group.cVactDa || 0;
        acc.acdVatops += group.cVact - group.cVatop > 0 ? group.cVact - group.cVatop : 0;
        acc.acVactTaa += group.cVactTaa || 0;
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactDat: 0,
        acVactDas: 0,
        acdVatops: 0,
        acVactTaa: 0,
      } as VatopCombinations
    );
  
    console.log("Calculated combinations:", combinations);
  
    setVatopCombinations(combinations);
    return combinations;
  };

  const updateVatopGroupsAndCombinations = (newVatopGroups: VatopGroup[]) => {
    // Filter out invalid groups (e.g., groups with cVact <= 0)
    const validGroups = newVatopGroups.filter((group) => group.cVact > 0);
  
    // Update vatopGroups state
    setVatopGroups(validGroups);
  
    // Immediately calculate and update vatopCombinations
    const newCombinations = validGroups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop || 0;
        acc.acVacts += group.cVact || 0;
        acc.acVactDat += group.cVactDat || 0;
        acc.acVactDas += group.cVactDa || 0;
        acc.acdVatops += Math.max(group.cVact - group.cVatop, 0);
        acc.acVactTaa += group.cVactTaa || 0;
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactDat: 0,
        acVactDas: 0,
        acdVatops: 0,
        acVactTaa: 0,
      } as VatopCombinations
    );
  
    setVatopCombinations({
      acVatops: parseFloat(newCombinations.acVatops.toFixed(2)),
      acVacts: parseFloat(newCombinations.acVacts.toFixed(2)),
      acVactDat: parseFloat(newCombinations.acVactDat.toFixed(2)),
      acVactDas: parseFloat(newCombinations.acVactDas.toFixed(2)),
      acdVatops: parseFloat(newCombinations.acdVatops.toFixed(2)),
      acVactTaa: parseFloat(newCombinations.acVactTaa.toFixed(7)),
    });
  
    console.log("Updated vatopCombinations:", newCombinations);
  };
  

  useEffect(() => {
    if (!vatopUpdateTrigger) return; // Only run if triggered
  
    const updatedVatopGroups = vatopGroups
      .map((group) => ({
        ...group,
        cVact: group.cVactDat, // Reflect cpVact in cVact
        cdVatop: group.cVact - group.cVatop,
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
  
    try {
      const response = await axios.get("/api/fetchVatopGroups", { params: { email } });
      const fetchedVatopGroups = response.data.vatopGroups || [];
  
  
      // Match and update existing groups
      const updatedVatopGroups = vatopGroups.map((group) => {
        const fetchedGroup = fetchedVatopGroups.find((fg: { id: string; }) => fg.id === group.id);
  
        if (!fetchedGroup) {
          console.warn(`Group with ID ${group.id} not found in fetchedVatopGroups.`);
          return group; // Preserve current group if not found
        }
  
        const newHAP = Math.max(fetchedGroup.HAP || fetchedGroup.cpVatop, newBitcoinPrice);
        const cpVact =
          (fetchedGroup.supplicateWBTCtoUSD === false && fetchedGroup.supplicateUSDtoWBTC === false) ||
          (fetchedGroup.supplicateWBTCtoUSD === false && fetchedGroup.supplicateUSDtoWBTC === true)
            ? newHAP
            : fetchedGroup.cpVact;
  
        const cVactDat = parseFloat((fetchedGroup.cVactTaa * newBitcoinPrice + fetchedGroup.cVactDa).toFixed(2));
        const cVact = cVactDat;
  
        const cVactTaa = fetchedGroup.supplicateWBTCtoUSD
          ? fetchedGroup.cVactTaa
          : cpVact === newBitcoinPrice
          ? cVactDat / newBitcoinPrice
          : 0;
  
        const cVactDa = fetchedGroup.supplicateWBTCtoUSD
          ? fetchedGroup.cVactDa
          : cpVact > newBitcoinPrice
          ? cVact
          : 0;
  
        const cdVatop = cVact - fetchedGroup.cVatop;
  
        return {
          ...group,
          HAP: newHAP,
          cpVact,
          cVact,
          cVactDat,
          cVactTaa,
          cVactDa,
          cdVatop,
        };
      });
  
      console.log("Updated Groups After Processing:", JSON.stringify(updatedVatopGroups, null, 2));
  
      // Update vatopGroups and vatopCombinations simultaneously
      updateVatopGroupsAndCombinations(updatedVatopGroups);
  
      // Save to backend
      await axios.post("/api/saveVatopGroups", {
        email,
        vatopGroups: updatedVatopGroups,
        vatopCombinations,
        soldAmounts,
      });
      console.log("Successfully saved updated groups.");
    } catch (error) {
      console.error("Error updating state:", error);
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
      const newCVact = group.cVactDat;
      const newCVactDa = newBitcoinPrice > 0 && newBitcoinPrice <= group.cpVatop ? newCVact : 0;

      return {
        ...group,
        HAP: newHighestPrice,
        cpVact: parseFloat(newCpVact.toFixed(2)),
        cVact: parseFloat(Math.max(newCVact, 0).toFixed(2)),
        cVactDa: parseFloat(newCVactDa.toFixed(2)),
        cVactDat: parseFloat(group.cVactDat.toFixed(4)),
        cdVatop: parseFloat((group.cVactDat - group.cpVatop).toFixed(2)),
        cVatop: parseFloat(group.cVatop.toFixed(2)),
      };
    });

    const retainedGroups = processedGroups.filter(
      (group) =>
        group.cVact > epsilon || group.cVactDat > epsilon || group.cVatop > epsilon
    );

    const newVatopCombinations = retainedGroups.reduce(
      (acc, group) => {
        acc.acVatops += group.cVatop;
        acc.acVacts += group.cVact;
        acc.acVactDat += group.cVactDat;
        acc.acVactDas += group.cVactDa;
        acc.acdVatops += group.cdVatop > 0 ? group.cdVatop : 0;
        return acc;
      },
      {
        acVatops: 0,
        acVacts: 0,
        acVactDat: 0,
        acVactDas: 0,
        acdVatops: 0,
        acVactTaa: 0,
      } as VatopCombinations
    );

    setVatopGroups(retainedGroups);
    setVatopCombinations({
      acVatops: parseFloat(newVatopCombinations.acVatops.toFixed(2)),
      acVacts: parseFloat(newVatopCombinations.acVacts.toFixed(2)),
      acVactDat: parseFloat(newVatopCombinations.acVactDat.toFixed(4)),
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
        cVact: group.cVactDat * Math.max(newPrice, hpap),
        cdVatop: group.cVactDa * (Math.max(newPrice, hpap) - group.cpVatop),
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
      cVactDat: amount,
      cVactDa: amount,
      cdVatop: 0,
      cVactTaa: amount / bitcoinPrice,
      HAP: bitcoinPrice,
      supplicateWBTCtoUSD: false,
      supplicateUSDtoWBTC: false,
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
        cVactDat: Math.max(group.cVactDat - sellAmount, 0),
        cVactTaa: Math.max(group.cVactTaa - sellAmount / group.cpVact, 0),
        cdVatop: Math.max(group.cVactDat * (group.cpVact - group.cpVatop), 0),
      };
    });

    const retainedGroups = updatedGroups.filter(
      (group) => group.cVatop > 0 || group.cVact > 0 || group.cVactDat > 0
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
      cVactDat: amount,
      cVactDa: amount,
      cdVatop: 0,
      cVactTaa: amount / bitcoinPrice,
      HAP: bitcoinPrice,
      supplicateWBTCtoUSD: false,
      supplicateUSDtoWBTC: false,
    };
  
    const updatedVatopGroups = [...vatopGroups, newVatop];
    await updateAllState(bitcoinPrice, email);
  };
  const handleImportABTC = async (amount: number) => {
    if (amount < 0.01) {
      alert('The minimum import amount is 0.01 USD.');
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
  
      const acVactDat = vatopCombinations.acVactDat || 0;
  
      if (aBTC - acVactDat < 0.01) {
        return;
      }
  
      if (aBTC > acVactDat) {
        const amountToImport = aBTC - acVactDat;
        const currentPrice = bitcoinPrice;
  
        const newGroup = {
          id: uuidv4(),
          cVatop: amountToImport,
          cpVatop: currentPrice,
          cVact: amountToImport,
          cpVact: currentPrice,
          cVactDat: amountToImport,
          cVactDa: 0,
          cdVatop: 0,
          cVactTaa: parseFloat((amountToImport / currentPrice).toFixed(8)),
          HAP: currentPrice,
          supplicateWBTCtoUSD: false,
          supplicateUSDtoWBTC: false,
        };
  
        const updatedVatopGroups = [...vatopGroups, newGroup];
  
        setVatopGroups(updatedVatopGroups);
        const newCombinations = updateVatopCombinations(updatedVatopGroups);
        setVatopCombinations(newCombinations);
  
        // Save new group data to backend
        try {
          console.log("Saving new group via handleImport...");
          await axios.post("/api/addVatopGroups", {
            email,
            newVatopGroups: [newGroup],
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
  
        const sellBTC = Math.min(group.cVactDat, remainingBTC);
        remainingBTC -= sellBTC;
  
        return {
          ...group,
          cVatop: Math.max(group.cVatop - sellBTC * group.cpVatop, 0),
          cVact: Math.max(group.cVact - sellBTC * group.cpVact, 0),
          cVactDat: Math.max(group.cVactDat - sellBTC, 0),
          cVactDa: Math.max(group.cVactDa - sellBTC * group.cpVact, 0),
          cVactTaa: group.cVactTaa > 0 ? Math.max(group.cVactDat - sellBTC, 0) : 0,
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