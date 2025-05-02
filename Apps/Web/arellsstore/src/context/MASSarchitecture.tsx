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
  supplicateCBBTCtoUSD: boolean;
  supplicateUSDtoCBBTC: boolean;
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

  const [cbBitcoinAmount, setCbBitcoinAmount] = useState<number | string>('');
  const [dollarAmount, setDollarAmount] = useState<number | string>('');
  const [supplicationResult, setSupplicationResult] = useState<string | null>(null);
  const [supplicationError, setSupplicationError] = useState<string | null>(null);
  const [isSupplicating, setIsSupplicating] = useState<boolean>(false);


// supplicateCBBTCtoUSDC functions
  const getCBBTCEquivalent = (usdcAmount: number, cpVact: number): number => {
    if (cpVact <= 0) {
      throw new Error('cpVact price must be greater than zero.');
    }
    return usdcAmount / cpVact; // Calculate CBBTC equivalent
  };

  const handleCBBTCsupplication = async (group: VatopGroup) => {
    const adjustedDollarInput = group.cVactDat; 
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
      const cbbtcEquivalent = Number((adjustedDollarInput / group.cpVact).toFixed(8));
      console.log("CBBTC Equivalent: ", cbbtcEquivalent);

  
      if (!MASSaddress || !MASSPrivateKey) {
        setSupplicationError("Wallet information is missing.");
        return false;
      }
  
      const payload = {
        cbBitcoinAmount: cbbtcEquivalent,
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
        cpVact: group.cpVact
      };
      
      console.log("📤 MASSProvider Payload:", payload); 
  
      const response = await axios.post("/api/MASS_cbbtc", payload);

  
      setSupplicationResult(
        `Supplication successful!`
      );
  
      setVatopGroups((prevGroups) => {
        const updatedGroups = prevGroups.map((g) =>
          g.id === group.id
            ? { ...g, supplicateCBBTCtoUSD: true, 
              supplicateUSDtoCBBTC: false, 
              holdMASS: true }
            : g
        );
        console.log("Updated Groups After setting Supplication:", updatedGroups); // Debugging log
  
        saveSupplications([
          {
            id: group.id,
            supplicateCBBTCtoUSD: true,
            supplicateUSDtoCBBTC: false,
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
  





// supplicateUSDCtoCBBTC functions
  const getUSDCEquivalent = (cbbtcAmount: number, bitcoinPrice: number): number => {
    return cbbtcAmount * bitcoinPrice; // Direct conversion without extra factors
  };
  const handleUSDCsupplication = async (group: VatopGroup) => {
    if (!cbBitcoinAmount || isNaN(Number(cbBitcoinAmount)) || Number(cbBitcoinAmount) <= 0) {
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
  
      const adjustedBTCInput = Math.min(Number(cbBitcoinAmount), usdcBalance / group.cpVact);
      console.log(`Adjusted BTC Input: ${adjustedBTCInput.toFixed(8)} CBBTC`);
  
      const usdcEquivalent = adjustedBTCInput * group.cpVact;

  
      if (usdcEquivalent === 0) {
        setSupplicationError("Calculated USDC amount is too small.");
        return;
      }
  
      const payload = {
        usdcAmount: usdcEquivalent,
        massAddress: MASSaddress,
        massPrivateKey: MASSPrivateKey,
        cpVact: group.cpVact
      };
  
      console.log("🚀 Sending Payload with Adjusted BTC Input and Shortfall:", payload);
  
      const response = await axios.post("/api/MASS_usdc", payload);
  
      setSupplicationResult(
        `CBBTC -> USDC Supplication successful!`
      );
  
      setVatopGroups((prevGroups) => {
        const updatedGroups = prevGroups.map((g) =>
          g.id === group.id
            ? { ...g, 
              supplicateCBBTCtoUSD: false, 
              supplicateUSDtoWBTC: true }
            : g
        );
  
        saveSupplications([
          {
            id: group.id,
            supplicateCBBTCtoUSD: false,
            supplicateUSDtoCBBTC: true,
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
    supplicateCBBTCtoUSD?: boolean; 
    supplicateUSDtoCBBTC?: boolean;
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
      if (group.cVactDa <= 0) {
        console.log(`Skipping CBBTCtoUSD supplication for group ${group.id} as cVactDa is 0.`);
        return; // Skip this group
      }
  
      // Trigger CBBTC to USDC supplication if `cVactDa` > 0.01
      if (group.cVactDa > 0.01) {
        console.log(`Initiating CBBTC to USDC supplication for group ${group.id} with amount: ${group.cVactDa}`);
  
        try {
          await handleCBBTCsupplication(group);
        } catch (error) {
          console.error(`Error during CBBTC to USDC supplication for group ${group.id}:`, error);
        }
      }
    });
  
    setPrevVatopGroups([...vatopGroups]); // Update previous groups after processing
  }, [vatopGroups]);
  useEffect(() => {
    const prevIds = prevVatopGroups.map((group) => group.id); // Match by `id`
  
    // Identify added and deleted groups
    const addedGroups = vatopGroups.filter((group) => !prevIds.includes(group.id));
  
    // Handle added groups
    if (addedGroups.length > 0) {
      console.log('Processing added groups:', addedGroups);
  
      addedGroups.forEach(async (group) => {
        // Ensure `supplicateCBBTCtoUSD` is `false` during initialization
        if (group.cVactDa <= 0) {
          console.log(`Skipping CBBTCtoUSD supplication for added group ${group.id} as cVactDa is 0.`);
          return;
        }
  
        // Only allow CBBTC to USDC supplication for added groups
        if (group.cVactDa > 0.01) {
          console.log(`Initiating CBBTC to USDC supplication for added group amount: ${group.cVactDa}`);

          // Convert cVactDa to CBBTC equivalent
          const cbbtcEquivalent = getCBBTCEquivalent(group.cVactDa, group.cpVact);
          console.log(`Converted cVactDa ${group.cVactDa} to CBBTC equivalent: ${cbbtcEquivalent.toFixed(8)}`);

          try {
            // Perform the supplication using the converted CBBTC equivalent
            // Usage
            await handleCBBTCsupplication(group)


          } catch (error) {
            console.error(`Error during CBBTC to USDC supplication for group ${group.id}:`, error);
            // Handle error or provide feedback to the user
          }
        }
      });
  
      setPrevVatopGroups([...vatopGroups]); // Update the state for tracking
      return; // Exit early, skipping further processing
    }
  
    // Process existing groups
    vatopGroups.forEach(async (group, index) => {
      const prevGroup = prevVatopGroups[index] || {};
  
      // Skip if holdMASS is `true`
      if (group.holdMASS) {
        console.log(`Skipping USDtoCBBTC supplication for group ${group.id} as holdMASS is true.`);
        return;
      }

  
      // Trigger USDC to CBBTC supplication only if `cVactTaa` has increased
      if (group.cVactTaa > 0.000001 && (!prevGroup.cVactTaa || group.cVactTaa > prevGroup.cVactTaa)) {
        console.log(`Initiating USDC to CBBTC supplication for amount: ${group.cVactTaa}`);
        const usdcEquivalent = getUSDCEquivalent(group.cVactTaa, bitcoinPrice);
        console.log(`Converted cVactDa ${group.cVactTaa} to CBTC equivalent: ${usdcEquivalent.toFixed(6)}`);
        try {
          await handleUSDCsupplication(group);
  
        } catch (error) {
          console.error(`Error during USD to CBBTC supplication for group ${group.id}:`, error);
          // Handle error or provide feedback to the user
        }
        
      }
  
      // Trigger CBBTC to USDC supplication only if `cVactDa` has increased
      if (group.cVactDa > 0.01 && (prevGroup?.cVactDa === undefined || group.cVactDa > prevGroup.cVactDa)) {
        console.log(`Initiating CBBTC to USDC supplication for added group amount: ${group.cVactDa}`);

        // Convert cVactDa to CBBTC equivalent
        const wbtcEquivalent = getCBBTCEquivalent(group.cVactDa, group.cpVact);
        console.log(`Converted cVactDa ${group.cVactDa} to CBBTC equivalent: ${wbtcEquivalent.toFixed(8)}`);

        try {
          // Perform the supplication using the converted CBBTC equivalent
          await handleCBBTCsupplication(group);

        } catch (error) {
          console.error(`Error during CBBTC to USDC supplication for group ${group.id}:`, error);
          // Handle error or provide feedback to the user
        }
      }
    });
  
    setPrevVatopGroups([...vatopGroups]); // Update previous groups
  }, [vatopGroups]);





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