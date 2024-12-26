'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useHPM } from './HPMarchitecture';
import { useSigner } from '../state/signer';


interface MASSarchitectureType {
  cVactTaa: number;
  cVactDa: number;
  releaseMASS: () => void;
  refreshVatopGroups: () => void;
}

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
  holdMASS: boolean;
}


const MASSarchitecture = createContext<MASSarchitectureType | undefined>(undefined);

export const MASSProvider = ({ children }: { children: ReactNode }) => {

  const {
    bitcoinPrice,
  } = useHPM();
  const {
    MASSaddress,
    MASSPrivateKey,
    balances
  } = useSigner();


  const [email, setEmail] = useState<string>('');
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [prevVatopGroups, setPrevVatopGroups] = useState<VatopGroup[]>([]);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        if (emailAttribute) setEmail(emailAttribute);
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    fetchEmail();
  }, []);

  const fetchVatopGroups = async () => {
    try {
      if (!email) return;
  
      const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
      const fetchedVatopGroups = response.data.vatopGroups || [];
      const validVatopGroups = fetchedVatopGroups.map((group: VatopGroup) => ({
        ...group,
        id: group.id || uuidv4(), // Ensure all groups have a unique ID
      }));
  
      setVatopGroups(validVatopGroups);
    } catch (error) {
      console.warn('Vatop Group Creation awaiting');
    }
  };



// MASS blockchain implementation code below

  const [wrappedBitcoinAmount, setWrappedBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [supplicationResult, setSupplicationResult] = useState<string | null>(null);
  const [supplicationError, setSupplicationError] = useState<string | null>(null);
  const [isSupplicating, setIsSupplicating] = useState<boolean>(false);


// supplicateWBTCtoUSDC functions
  const getWBTCEquivalent = (usdcAmount: number, bitcoinPrice: number): number => {
    if (bitcoinPrice <= 0) {
      throw new Error('Bitcoin price must be greater than zero.');
    }
    return usdcAmount / bitcoinPrice; // Calculate WBTC equivalent
  };

  const handleWBTCsupplication = async (group: VatopGroup) => {
    const adjustedDollarInput = group.cVactDa; 
    console.log("Adjusted dollar amount: ", adjustedDollarInput);
  
    if (isNaN(adjustedDollarInput) || adjustedDollarInput <= 0) {
      setSupplicationError("Please enter a valid dollar amount.");
      return false;
    }
  
    if (!group.cpVact || group.cpVact <= 0) {
      console.error("Invalid or missing cpVact value.");
      setSupplicationError("Transaction price data is missing or invalid.");
      return false;
    }
  
    try {
      const massBalanceInBTC = parseFloat(balances.BTC_BASE || "0");
      console.log("Available MASS Balance (BTC): ", massBalanceInBTC);
  
      const wbtcEquivalent = adjustedDollarInput / group.cpVact;
      console.log("WBTC Equivalent: ", wbtcEquivalent);
  
      const formattedWbtc = Math.min(Number(wbtcEquivalent.toFixed(8)), massBalanceInBTC);
      console.log("Adjusted Formatted WBTC: ", formattedWbtc);
  
      const wbtcInSatoshis = Math.round(formattedWbtc * 1e8);
  
      if (!MASSaddress || !MASSPrivateKey) {
        setSupplicationError("Wallet information is missing.");
        return false;
      }
  
      const payload = {
        wrappedBitcoinAmount: wbtcInSatoshis,
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      };
  
      const response = await axios.post("/api/MASSapi", payload);
      const { receivedAmount, txId } = response.data;
  
      setSupplicationResult(
        `Supplication successful! Received ${receivedAmount} USDC. Transaction ID: ${txId}`
      );
  
      setVatopGroups((prevGroups) => {
        const updatedGroups = prevGroups.map((g) =>
          g.id === group.id
            ? { ...g, supplicateWBTCtoUSD: true, 
              supplicateUSDtoWBTC: false, 
              holdMASS: true }
            : g
        );
        console.log("Updated Groups After setting Supplication:", updatedGroups); // Debugging log
  
        saveSupplications([
          {
            id: group.id,
            supplicateWBTCtoUSD: true,
            supplicateUSDtoWBTC: false,
            holdMASS: true,
          },
        ]);

        console.log("Updated Groups After saving Supplication:", updatedGroups); // Debugging log
  
        return updatedGroups;
      });
  
      return true;
    } catch (error) {
      console.error("❌ API Error:", error);
      setSupplicationError("Supplication failed. Please try again.");
      return false;
    }
  };
  





// supplicateUSDCtoWBTC functions
  const getUSDCEquivalent = (wbtcAmount: number, bitcoinPrice: number): number => {
    return wbtcAmount * bitcoinPrice; // Direct conversion without extra factors
  };
  const handleUSDCsupplication = async (group: VatopGroup) => {
    if (!wrappedBitcoinAmount || isNaN(Number(wrappedBitcoinAmount)) || Number(wrappedBitcoinAmount) <= 0) {
      setSupplicationError("Please enter a valid amount.");
      return;
    }
  
    if (!MASSaddress || !MASSPrivateKey) {
      setSupplicationError("Wallet information is missing.");
      return;
    }
  
    if (!group.cpVact || group.cpVact <= 0) {
      console.error("Invalid or missing cpVact value.");
      setSupplicationError("Transaction price data is missing or invalid.");
      return;
    }
  
    try {
      const usdcBalance = parseFloat(balances.USDC_BASE || "0");
      console.log("Available USDC Balance: ", usdcBalance);
  
      const adjustedBTCInput = Math.min(Number(wrappedBitcoinAmount), usdcBalance / group.cpVact);
      console.log(`Adjusted BTC Input: ${adjustedBTCInput.toFixed(8)} WBTC`);
  
      const usdcEquivalent = adjustedBTCInput * group.cpVact;
      const usdcInMicroUnits = Math.floor(usdcEquivalent * 1e6);
  
      if (usdcInMicroUnits === 0) {
        setSupplicationError("Calculated USDC amount is too small.");
        return;
      }
  
      const payload = {
        usdcAmount: usdcInMicroUnits,
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
      };
  
      console.log("🚀 Sending Payload with Adjusted BTC Input and Shortfall:", payload);
  
      const response = await axios.post("/api/MASSsupplicationApi", payload);
      const { receivedAmount, txId } = response.data;
  
      setSupplicationResult(
        `Supplication successful! Received ${receivedAmount} cbBTC. Transaction ID: ${txId}`
      );
  
      setVatopGroups((prevGroups) => {
        const updatedGroups = prevGroups.map((g) =>
          g.id === group.id
            ? { ...g, 
              supplicateWBTCtoUSD: false, 
              supplicateUSDtoWBTC: true }
            : g
        );
  
        saveSupplications([
          {
            id: group.id,
            supplicateWBTCtoUSD: false,
            supplicateUSDtoWBTC: true,
          },
        ]);
  
        return updatedGroups;
      });
    } catch (error) {
      console.error("❌ API Error:", error);
      setSupplicationError("Supplication failed. Please try again.");
    }
  };

// MASS blockchain implementation code above   








  const saveSupplications = async (updates: { 
    id: string; 
    supplicateWBTCtoUSD?: boolean; 
    supplicateUSDtoWBTC?: boolean;
    holdMASS?: boolean 
  }[]) => {
    try {
      const payload = {
        email,
        supplicationUpdates: updates,
      };

      const response = await axios.post('/api/saveSupplications', payload);
      console.log('Supplications save response:', response.data);
    } catch (error) {
      console.error('Error saving supplications:', error);
    }
  };

  useEffect(() => {
    fetchVatopGroups();

    const interval = setInterval(fetchVatopGroups, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [email]);








  useEffect(() => {
    vatopGroups.forEach(async (group) => {
      // Skip groups where `supplicateWBTCtoUSD` is already true
      if (group.supplicateWBTCtoUSD) {
        console.log(`Skipping group ${group.id} as supplicateWBTCtoUSD is true.`);
        return; // Skip this group
      }
  
      // Trigger WBTC to USDC supplication if `cVactDa` > 0.01
      if (!group.supplicateWBTCtoUSD && group.cVactDa > 0.01) {
        console.log(`Initiating WBTC to USDC supplication for group ${group.id} with amount: ${group.cVactDa}`);
  
        try {
          await handleWBTCsupplication(group);
        } catch (error) {
          console.error(`Error during WBTC to USDC supplication for group ${group.id}:`, error);
        }
      }
    });
  
    setPrevVatopGroups([...vatopGroups]); // Update previous groups after processing
  }, [vatopGroups]);
  // useEffect(() => {
  //   const prevIds = prevVatopGroups.map((group) => group.id); // Match by `id`
  //   const currentIds = vatopGroups.map((group) => group.id);
  
  //   // Identify added and deleted groups
  //   const addedGroups = vatopGroups.filter((group) => !prevIds.includes(group.id));
  //   const deletedGroups = prevVatopGroups.filter((group) => !currentIds.includes(group.id));
  
  //   // Handle added groups
  //   if (addedGroups.length > 0) {
  //     console.log('Processing added groups:', addedGroups);
  
  //     addedGroups.forEach(async (group) => {
  //       // Ensure `supplicateWBTCtoUSD` is `false` during initialization
  //       if (group.supplicateWBTCtoUSD) {
  //         console.log(`Skipping added group ${group.id} as supplicateWBTCtoUSD is true.`);
  //         return;
  //       }
  
  //       // Only allow WBTC to USDC supplication for added groups
  //       if (!group.supplicateWBTCtoUSD && group.cVactDa > 0.01) {
  //         console.log(`Initiating WBTC to USDC supplication for added group amount: ${group.cVactDa}`);

  //         // Convert cVactDa to WBTC equivalent
  //         const wbtcEquivalent = getWBTCEquivalent(group.cVactDa, bitcoinPrice);
  //         console.log(`Converted cVactDa ${group.cVactDa} to WBTC equivalent: ${wbtcEquivalent.toFixed(8)}`);

  //         try {
  //           // Perform the supplication using the converted WBTC equivalent
  //           // Usage
  //           await handleWBTCsupplication(group)


  //         } catch (error) {
  //           console.error(`Error during WBTC to USDC supplication for group ${group.id}:`, error);
  //           // Handle error or provide feedback to the user
  //         }
  //       }
  //     });
  
  //     setPrevVatopGroups([...vatopGroups]); // Update the state for tracking
  //     return; // Exit early, skipping further processing
  //   }
  
  //   // Process existing groups
  //   vatopGroups.forEach(async (group, index) => {
  //     const prevGroup = prevVatopGroups[index] || {};
  
  //     // Skip if `supplicateWBTCtoUSD` is `true`
  //     if (group.supplicateWBTCtoUSD) {
  //       console.log(`Skipping supplication for group ${group.id} as supplicateWBTCtoUSD is true.`);
  //       return;
  //     }

  
  //     // Trigger USDC to WBTC supplication only if `cVactTaa` has increased
  //     if (group.cVactTaa > 0.000001 && (!prevGroup.cVactTaa || group.cVactTaa > prevGroup.cVactTaa)) {
  //       console.log(`Initiating USDC to WBTC supplication for amount: ${group.cVactTaa}`);
  //       const usdcEquivalent = getUSDCEquivalent(group.cVactTaa, bitcoinPrice);
  //       console.log(`Converted cVactDa ${group.cVactTaa} to WBTC equivalent: ${usdcEquivalent.toFixed(4)}`);
  //       try {
  //         await handleUSDCsupplication(group);
  
  //       } catch (error) {
  //         console.error(`Error during USD to WBTC supplication for group ${group.id}:`, error);
  //         // Handle error or provide feedback to the user
  //       }
        
  //     }
  
  //     // Trigger WBTC to USDC supplication only if `cVactDa` has increased
  //     if (group.cVactDa > 0.01 && (prevGroup?.cVactDa === undefined || group.cVactDa > prevGroup.cVactDa)) {
  //       console.log(`Initiating WBTC to USDC supplication for added group amount: ${group.cVactDa}`);

  //       // Convert cVactDa to WBTC equivalent
  //       const wbtcEquivalent = getWBTCEquivalent(group.cVactDa, bitcoinPrice);
  //       console.log(`Converted cVactDa ${group.cVactDa} to WBTC equivalent: ${wbtcEquivalent.toFixed(8)}`);

  //       try {
  //         // Perform the supplication using the converted WBTC equivalent
  //         await handleWBTCsupplication(group);

  //       } catch (error) {
  //         console.error(`Error during WBTC to USDC supplication for group ${group.id}:`, error);
  //         // Handle error or provide feedback to the user
  //       }
  //     }
  //   });
  
  //   setPrevVatopGroups([...vatopGroups]); // Update previous groups
  // }, [vatopGroups]);





  const releaseMASS = async () => {
    try {
      const updatedGroups = vatopGroups.map((group) => ({
        ...group,
        holdMASS: false,
      }));
  
      setVatopGroups(updatedGroups); // Update local state
  
      const updates = updatedGroups.map((group) => ({
        id: group.id,
        holdMASS: false,
      }));
  
      console.log('Released MASS hold for all groups:', updates);
  
      await saveSupplications(updates);
      console.log('Changes saved to backend successfully.');
    } catch (error) {
      console.error('Error in resetSupplicateWBTCtoUSD:', error);
    }
  };





// For testing purposes

  // const toggleSupplicateWBTCtoUSD = (groupId: string, value: boolean) => {
  //   setVatopGroups((prevGroups) =>
  //     prevGroups.map((group) =>
  //       group.id === groupId ? { ...group, supplicateWBTCtoUSD: value } : group
  //     )
  //   );
  // };

  // const supplicateUSDCintoWBTC = async (amount: number, group: VatopGroup) => {
  //   if (amount <= 0) {
  //     console.log('Supplication amount must be greater than 0. Skipping.');
  //     return;
  //   }
  //   console.log(`Supplicating USDC into WBTC for amount: ${amount}`);
  //   toggleSupplicateWBTCtoUSD(group.id, true);
  //   // Add your logic here (e.g., calling an API or updating state).
  // };

  // const supplicateWBTCintoUSDC = async (amount: number, group: VatopGroup) => {
  //   if (amount <= 0) {
  //     console.log('Supplication amount must be greater than 0. Skipping.');
  //     return;
  //   }
  //   console.log(`Supplicating WBTC into USDC for amount: ${amount}`);
  //   // Add your logic here (e.g., calling an API or updating state).
  // };

  return (
<MASSarchitecture.Provider
  value={{
    cVactTaa: vatopGroups.reduce((sum, group) => sum + group.cVactTaa, 0),
    cVactDa: vatopGroups.reduce((sum, group) => sum + group.cVactDa, 0),
    releaseMASS, // Use the actual function
    refreshVatopGroups: fetchVatopGroups,
  }}
>
  {children}
</MASSarchitecture.Provider>
  );
};

export const useMASS = () => {
  const context = useContext(MASSarchitecture);
  if (!context) {
    throw new Error('useMASS must be used within a MASSProvider');
  }
  return context;
};