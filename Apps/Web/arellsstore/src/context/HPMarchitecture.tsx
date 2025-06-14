'use client';

import { useUser } from './UserContext';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchBitcoinPrice } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';
import { useSigner } from '../state/signer'; 
import { useRef } from 'react';


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
  supplicateCBBTCtoUSD: boolean;
  supplicateUSDtoCBBTC: boolean;
  holdMASS: boolean;
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
      balances,
      loadBalances,
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
        console.log("Fetched price from API:", price);
        if (price > 0) {
          setBitcoinPrice(price);
        } else {
          console.warn("Invalid Bitcoin price fetched:", price);
        }
      } catch (error) {
        console.error("Error fetching Bitcoin price:", error);
      }
    };
  
    // Fetch the price initially
    fetchPrice();
  
    // Set up a 10-second interval for recurring fetch
    const intervalId = setInterval(fetchPrice, 10000);
  
    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
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
    let isFetchingGroups = false;
  
    const fetchVatopGroups = async (latestPrice: number) => {
      if (!email) {
        console.warn("Email is not set, cannot fetch vatopGroups.");
        return;
      }
  
      // Prevent overlapping calls
      if (isFetchingGroups) {
        console.warn("fetchVatopGroups is already in progress. Skipping this call.");
        return;
      }
  
      isFetchingGroups = true;
  
      try {
        const response = await axios.get("/api/fetchVatopGroups", { params: { email } });
        const fetchedVatopGroups = response.data.vatopGroups || [];
        const fetchedSoldAmounts = response.data.soldAmounts || 0;
  
        // Update existing groups with fetched data
        const updatedVatopGroups = fetchedVatopGroups.map((fetchedGroup: VatopGroup) => {
          if (fetchedGroup.holdMASS) {
            return fetchedGroup;
          }

          const newHAP = Math.max(fetchedGroup.HAP || fetchedGroup.cpVatop, latestPrice);
        
          const cpVact = fetchedGroup.supplicateUSDtoCBBTC
            ? newHAP
            : fetchedGroup.cpVact;
        
          const cVactTaa = Number((fetchedGroup.cVactTaa).toFixed(8)); // 🛠️ Fix precision
          const cVactDat = Number((cVactTaa * cpVact + (fetchedGroup.cVactDa || 0)).toFixed(6)); // 🛠️ Fix calculation
          const cVact = cVactDat;
        
          const cVactTaaFinal = fetchedGroup.supplicateCBBTCtoUSD
            ? cVactTaa
            : cpVact === bitcoinPrice
            ? Number((cVactDat / bitcoinPrice).toFixed(8))
            : 0;
        
          const cVactDa = fetchedGroup.supplicateCBBTCtoUSD
            ? fetchedGroup.cVactDa
            : cpVact > bitcoinPrice
            ? cVact
            : 0;
        
          const cdVatop = parseFloat((cVact - fetchedGroup.cVatop).toFixed(6));
        
          return {
            ...fetchedGroup,
            HAP: newHAP,
            cpVact,
            cVact,
            cVactDat,
            cVactTaa: cVactTaaFinal,
            cVactDa,
            cdVatop,
          };
        });
  

        setVatopGroups(updatedVatopGroups);
        setSoldAmounts(fetchedSoldAmounts);

        // Recalculate combinations directly from backend data
        const combinations = updateVatopCombinations(fetchedVatopGroups);
        setVatopCombinations(combinations);

        // Update HPAP based on backend data
        const maxCpVact = Math.max(...fetchedVatopGroups.map((group: { cpVact: any; }) => group.cpVact || 0));
        setHpap(maxCpVact);

        // Save updated data to backend
        await saveVatopGroups({
          email,
          vatopGroups: updatedVatopGroups,
          vatopCombinations: combinations,
          soldAmounts: fetchedSoldAmounts,
        });
        return fetchedVatopGroups; 
      } catch (error) {
        console.warn("Awaiting Vatop Group fetching");
      } finally {
        isFetchingGroups = false;
      }
    };

    const interval = setInterval(() => {
      fetchVatopGroups(bitcoinPrice); 
    }, 3500);
    return () => clearInterval(interval);
  }, [email, bitcoinPrice]);

  useEffect(() => {
    if (!email || bitcoinPrice <= 0) return;
  
    const isImportingRef = { current: false };
  
    const importIfNeeded = async () => {
      if (!email || bitcoinPrice <= 0) return;
      if (isImportingRef.current) return;
  
      isImportingRef.current = true;
  
      try {
        const aBTC = await readABTCFile();
        if (aBTC === null) return;
  
        const normalizedABTC = aBTC; 
        const normalizedAcVactDat = vatopCombinations.acVactDat; 
        const amountToImport = normalizedABTC - normalizedAcVactDat; 
  
        console.log("🚦 Checking Import Logic:", {
          aBTC: normalizedABTC,
          acVactDat: normalizedAcVactDat,
          amountToImport,
        });
  
        if (amountToImport <= 0.01) {
          console.log("🚫 No meaningful amount to import.");
          return;
        }
  
        console.log("🚀 Importing new Vatop group...");
  
        const cVactTaa = Number((amountToImport / bitcoinPrice).toFixed(8)); 
        const cVactDat = Number((cVactTaa * bitcoinPrice).toFixed(6));
        
        const newGroup = { 
          id: uuidv4(),
          cVatop: amountToImport,
          cpVatop: bitcoinPrice,
          cVact: cVactDat,
          cpVact: bitcoinPrice,
          cVactDat: cVactDat,
          cVactDa: 0,
          cdVatop: 0,
          cVactTaa: cVactTaa,
          HAP: bitcoinPrice,
          supplicateCBBTCtoUSD: false,
          supplicateUSDtoCBBTC: true,
          holdMASS: false,
        };
  
        const updatedGroups = [...vatopGroups, newGroup];
        setVatopGroups(updatedGroups);
  
        const updatedCombinations = updateVatopCombinations(updatedGroups);
        setVatopCombinations(updatedCombinations);
  
        await axios.post("/api/addVatopGroups", {
          email,
          newVatopGroups: [newGroup],
          vatopCombinations: updatedCombinations,
          soldAmounts,
        });
      } catch (error) {
        console.error("❌ Import failed:", error);
      } finally {
        isImportingRef.current = false;
      }
    };
  
    const interval = setInterval(() => {
      importIfNeeded();
    }, 5000); // ✅ Run every 5 seconds
  
    return () => clearInterval(interval); // ✅ Clear interval on unmount
  }, [email, bitcoinPrice, vatopCombinations]);





  const updateVatopCombinations = (groups: VatopGroup[]): VatopCombinations => {
  
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
  
  
    setVatopCombinations(combinations);
    return combinations;
  };
  




























  const updateVatopGroupsAndCombinations = (updatedVatopGroups: VatopGroup[]) => {
    
    // Ensure updated groups match existing ones by ID
    const validatedGroups = vatopGroups.map((existingGroup) => {
        const matchingGroup = updatedVatopGroups.find((group) => group.id === existingGroup.id);
        return matchingGroup ? { ...existingGroup, ...matchingGroup } : existingGroup;
    });

    // Log unexpected additions
    const extraGroups = updatedVatopGroups.filter(
        (group) => !vatopGroups.find((existing) => existing.id === group.id)
    );

    if (extraGroups.length > 0) {
        console.error("⚠️ Extra groups detected and ignored:", JSON.stringify(extraGroups, null, 2));
    }

    // Update state with validated groups only
    setVatopGroups(validatedGroups);

    // Calculate combinations
    const newCombinations = validatedGroups.reduce((acc, group) => {
        acc.acVatops += group.cVatop || 0;
        acc.acVacts += group.cVact || 0;
        acc.acVactDat += group.cVactDat || 0;
        acc.acVactDas += group.cVactDa || 0;
        acc.acdVatops += Math.max(group.cVact - group.cVatop, 0);
        acc.acVactTaa += group.cVactTaa || 0;
        return acc;
    }, {
        acVatops: 0,
        acVacts: 0,
        acVactDat: 0,
        acVactDas: 0,
        acdVatops: 0,
        acVactTaa: 0,
    });
    setVatopCombinations(newCombinations);
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
      return;
    }
  
    const highestCpVact = Math.max(...vatopGroups.map((group) => group.cpVact || 0));
    setHpap(highestCpVact);
  }, [vatopGroups]); // Depend on vatopGroups and bitcoinPrice




























  let isUpdatingAllState = false;

  //Below for Buying/Selling functions 
  const updateAllState = async (newBitcoinPrice: number, email: string) => {
    if (!email) {
      console.error("Email is required for updateAllState.");
      return;
    }
  
    // Guard against overlapping updates
    if (isUpdatingAllState) {
      console.warn("updateAllState is already in progress. Skipping this call.");
      return;
    }
  
    isUpdatingAllState = true;
  
    try {
      const response = await axios.get("/api/fetchVatopGroups", { params: { email } });
      const fetchedVatopGroups = response.data.vatopGroups || [];
      const fetchedSoldAmounts = response.data.soldAmounts || 0;
  
      // Update existing groups only
      const updatedVatopGroups = vatopGroups.map((existingGroup) => {
        const fetchedGroup = fetchedVatopGroups.find((fg: VatopGroup) => fg.id === existingGroup.id);

  
        // Update group attributes
        const newHAP = Math.max(fetchedGroup.HAP || fetchedGroup.cpVatop, newBitcoinPrice);
        const cpVact = fetchedGroup.supplicateUSDtoCBBTC
        ? newHAP // If supplicateUSDtoCBBTC is true, use newHAP
        : fetchedGroup.cpVact; // Otherwise, use the existing cpVact
  
        const cVactDat = fetchedGroup.cVactTaa * cpVact + fetchedGroup.cVactDa;
        const cVact = cVactDat;
  
        const cVactTaa = fetchedGroup.supplicateCBBTCtoUSD
          ? fetchedGroup.cVactTaa
          : cpVact === newBitcoinPrice
          ? cVactDat / newBitcoinPrice
          : 0;
  
        const cVactDa = fetchedGroup.supplicateCBBTCtoUSD
          ? fetchedGroup.cVactDa
          : cpVact > newBitcoinPrice
          ? cVact
          : 0;
  
        const cdVatop = parseFloat((cVact - fetchedGroup.cVatop).toFixed(2));
  
        return {
          ...existingGroup,
          HAP: newHAP,
          cpVact: cpVact,
          cVact: cVact,
          cVactDat: cVactDat,
          cVactTaa: cVactTaa,
          cVactDa: cVactDa,
          cdVatop: cdVatop,
        };
      });

      // Recalculate HPAP
      const maxCpVact = Math.max(...updatedVatopGroups.map((group) => group.cpVact || 0));
      setHpap(maxCpVact);
      // Update state and backend
      updateVatopGroupsAndCombinations(updatedVatopGroups);
      setSoldAmounts(fetchedSoldAmounts);

      console.log("📤 Sending to backend →", {
        email,
        vatopGroups: updatedVatopGroups,
        vatopCombinations,
        soldAmounts,
      });
  
      await axios.post("/api/saveVatopGroups", {
        email,
        vatopGroups: updatedVatopGroups,
        vatopCombinations,
        soldAmounts,
      });
    } catch (error) {
      console.error("❌ Error updating state:", error);
    } finally {
      isUpdatingAllState = false;
    }
  };




















  
  const setManualBitcoinPrice = async (
    price: number | ((currentPrice: number) => number)
  ) => {
    const newPrice = typeof price === "function" ? price(bitcoinPrice) : price;
  
    // Set the new Bitcoin price
    setBitcoinPrice(newPrice);
  };


  const readABTCFile = async (): Promise<number | null> => {
    try {
      if (!email) throw new Error("Email is not set in context.");
      
      const response = await axios.get('/api/readABTC', { params: { email } });
      console.log("Response from readABTCFile:", response.data);
      return response.data.aBTC || 0;
    } catch (error) {
      console.warn('Awaiting aBTC creation');
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
    console.log("⚠️ handleBuy called with amount:", amount);
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
      supplicateCBBTCtoUSD: false,
      supplicateUSDtoCBBTC: true,
      holdMASS: false,
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
    console.log("⚠️ handleBuy called with amount:", amount);
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
      supplicateCBBTCtoUSD: false,
      supplicateUSDtoCBBTC: true,
      holdMASS: false,
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

  const balancesRef = useRef(balances);
  useEffect(() => {
    balancesRef.current = balances; 
  }, [balances]);
  
  useEffect(() => {
    if (!email || !bitcoinPrice || bitcoinPrice <= 0) {
      console.warn("Skipping interval: Missing email or valid Bitcoin price.");
      return;
    }
    if (!balances.BTC_BASE && !balances.USDC_BASE) {
      console.warn("Skipping interval: Balances not loaded.");
      return;
    }
  
    const interval = setInterval(async () => {
      console.log("Running balance fetch interval...");
      await loadBalances();
  
      const btcBalance = parseFloat(balancesRef.current?.BTC_BASE || "0");
      const usdBalance = parseFloat(balancesRef.current?.USDC_BASE || "0");
      console.log("Balances in interval:", { btcBalance, usdBalance });
  
      const usdFromBTC = btcBalance * bitcoinPrice;
      const totalUSDC = usdBalance + usdFromBTC;
  
      console.log("Total USDC calculated:", totalUSDC);
  
      try {
        await axios.post("/api/saveABTC", { email, amount: totalUSDC });
      } catch (error) {
        console.error("Error importing aBTC:", error);
      }
    }, 2000);
  
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [email, bitcoinPrice]);


  
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
      const roundedGroups = vatopGroups.map((group) => ({
        ...group,
        cVact: parseFloat(group.cVact.toFixed(6)),
        cVactDat: parseFloat(group.cVactDat.toFixed(6)),
        cVactDa: parseFloat(group.cVactDa.toFixed(6)),
      }));
  
      const payload = {
        email,
        vatopGroups: roundedGroups,
        vatopCombinations,
        soldAmounts,
      };
  
      await axios.post('/api/saveVatopGroups', payload);
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }
  };
  const handleSell = async (amount: number) => {
  
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
    }
  };

  const toggleSupplicateWBTCtoUSD = (groupId: string, value: boolean) => {
    setVatopGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, supplicateCBBTCtoUSD: value } : group
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
  const context = useContext(
    HPMarchitecture
  );
  if (context === undefined) {
    throw new Error('useHPM must be used within an HPMProvider');
  }
  return context;
};
