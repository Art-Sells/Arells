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
  resetSupplicateWBTCtoUSD: () => void;
  refreshVatopGroups: () => void;
}

interface VatopGroup {
  id: string; 
  cpVatop: number;
  cVactDat: number;
  cVactDa: number;
  cVactTaa: number;
  cpVact: number; 
  supplicateWBTCtoUSD: boolean;
  supplicateUSDtoWBTC: boolean;
  HAP: number;
}

const MASSarchitecture = createContext<MASSarchitectureType | undefined>(undefined);

export const MASSProvider = ({ children }: { children: ReactNode }) => {

  const {
    bitcoinPrice,
  } = useHPM();
  const {
    MASSaddress,
    MASSsupplicationAddress,
    MASSPrivateKey,
    MASSsupplicationPrivateKey,
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
      console.error('Error fetching vatop groups:', error);
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
  // Subtract 0.01 from the dollar input for adjustment
  const adjustedDollarInput = parseFloat(String(group.cVactDa)) - 0.01;
  console.log("Adjusted Dollar Input:", adjustedDollarInput);

  if (isNaN(adjustedDollarInput) || adjustedDollarInput <= 0) {
    setSupplicationError('Please enter a valid dollar amount.');
    return;
  }

  // Ensure cpVact is available and valid
  if (!group.cpVact || group.cpVact <= 0) {
    console.error("Invalid or missing cpVact value.");
    setSupplicationError("Transaction price data is missing or invalid.");
    return;
  }

  // Convert adjusted dollars to BTC equivalent using cpVact
  const wbtcEquivalent = adjustedDollarInput / group.cpVact;
  console.log("WBTC Equivalent (BTC):", wbtcEquivalent);

  // Format the BTC to string with 8 decimal places then convert to satoshis
  const formattedWbtc = Number(wbtcEquivalent.toFixed(8));
  const wbtcInSatoshis = Math.round(formattedWbtc * 1e8);
  console.log("WBTC in Satoshis:", wbtcInSatoshis);

  if (!MASSaddress || !MASSsupplicationAddress || !MASSPrivateKey) {
    setSupplicationError('Wallet information is missing.');
    return;
  }

  const payload = {
    wrappedBitcoinAmount: wbtcInSatoshis,
    massAddress: MASSaddress,
    massPrivateKey: MASSPrivateKey,
    massSupplicationAddress: MASSsupplicationAddress,
  };

  console.log('🚀 Sending Payload:', payload);

  try {
    const response = await axios.post('/api/MASSapi', payload);
    const { receivedAmount, txId } = response.data;
    setSupplicationResult(`Supplication successful! Received ${receivedAmount} USDC. Transaction ID: ${txId}`);
  } catch (error) {
    console.error('❌ API Error:', error);
    setSupplicationError('Supplication failed. Please try again.');
  } finally {
    setIsSupplicating(false);
  }
};




// supplicateUSDCtoWBTC functions
  const getUSDCEquivalent = (wbtcAmount: number, bitcoinPrice: number): number => {
    return wbtcAmount * bitcoinPrice; // Direct conversion without extra factors
  };
  const handleUSDCsupplication = async (group: VatopGroup) => {
    if (!wrappedBitcoinAmount || isNaN(Number(wrappedBitcoinAmount)) || Number(wrappedBitcoinAmount) <= 0) {
      setSupplicationError('Please enter a valid amount.');
      return;
    }
  
    if (!MASSsupplicationAddress || !MASSsupplicationPrivateKey || !MASSaddress) {
      setSupplicationError('Wallet information is missing.');
      return;
    }
  
    // Ensure cpVact is available and valid
    if (!group.cpVact || group.cpVact <= 0) {
      console.error("Invalid or missing cpVact value.");
      setSupplicationError("Transaction price data is missing or invalid.");
      return;
    }
  
    setSupplicationError(null);
    setIsSupplicating(true);
  
    try {
      // Calculate USDC equivalent using cpVact instead of bitcoinPrice
      const usdcEquivalent = getUSDCEquivalent(Number(wrappedBitcoinAmount), group.cpVact);;
  
      // Apply shortfall by rounding down by 1 cent
      const usdcShortfall = Math.max(0, usdcEquivalent - 0.01); // Ensure no negative values
      const usdcInMicroUnits = Math.floor(usdcShortfall * 1e6); // Convert to base units
  
      if (usdcInMicroUnits === 0) {
        setSupplicationError('Calculated USDC amount is too small.');
        return;
      }
  
      const payload = {
        usdcAmount: usdcInMicroUnits,
        massSupplicationAddress: MASSsupplicationAddress,
        massSupplicationPrivateKey: MASSsupplicationPrivateKey,
        massAddress: MASSaddress,
      };
  
      console.log('🚀 Sending Payload with Shortfall:', payload);
  
      const response = await axios.post('/api/MASSsupplicationApi', payload);
  
      const { receivedAmount, txId } = response.data;
      setSupplicationResult(`Supplication successful! Received ${receivedAmount} WBTC. Transaction ID: ${txId}`);
    } catch (error) {
      console.error('❌ API Error:', error);
      setSupplicationError('Supplication failed. Please try again.');
    } finally {
      setIsSupplicating(false);
    }
  };

// MASS blockchain implementation code above   








  const saveVatopGroups = async ({
    email,
    vatopGroups,
  }: {
    email: string;
    vatopGroups: VatopGroup[];
  }) =>  {
    try {
      // Prepare minimal data for payload
      const minimalVatopGroups = vatopGroups.map(({ id, cVactDat, cpVatop, HAP, supplicateWBTCtoUSD }) => ({
        id,
        cVactDat,
        cpVatop,
        HAP,
        supplicateWBTCtoUSD,
      }));
  
      const payload = {
        email,
        vatopGroups: minimalVatopGroups,
      };
  
      console.log('Minimal Payload to save:', payload);
  
      const response = await axios.post('/api/saveVatopGroups', payload);
      console.log('Save response:', response.data);
    } catch (error) {
      console.error('Error saving vatop groups:', error);
    }
  };

  useEffect(() => {
    fetchVatopGroups();

    const interval = setInterval(fetchVatopGroups, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [email]);









  useEffect(() => {
    const prevIds = prevVatopGroups.map((group) => group.id); // Match by `id`
    const currentIds = vatopGroups.map((group) => group.id);
  
    // Identify added and deleted groups
    const addedGroups = vatopGroups.filter((group) => !prevIds.includes(group.id));
    const deletedGroups = prevVatopGroups.filter((group) => !currentIds.includes(group.id));
  
    // Handle added groups
    if (addedGroups.length > 0) {
      console.log('Processing added groups:', addedGroups);
  
      addedGroups.forEach(async (group) => {
        // Ensure `supplicateWBTCtoUSD` is `false` during initialization
        if (group.supplicateWBTCtoUSD) {
          console.log(`Skipping added group ${group.id} as supplicateWBTCtoUSD is true.`);
          return;
        }
  
        // Only allow WBTC to USDC supplication for added groups
        if (group.cVactDa > 0.01) {
          console.log(`Initiating WBTC to USDC supplication for added group amount: ${group.cVactDa}`);

          // Convert cVactDa to WBTC equivalent
          const wbtcEquivalent = getWBTCEquivalent(group.cVactDa, bitcoinPrice);
          console.log(`Converted cVactDa ${group.cVactDa} to WBTC equivalent: ${wbtcEquivalent.toFixed(8)}`);

          try {
            // Perform the supplication using the converted WBTC equivalent
            await handleWBTCsupplication(group);

            // If successful, update the group state
            setVatopGroups((prevGroups) => {
              const updatedGroups = prevGroups.map((g) =>
                g.id === group.id ? { ...g, supplicateWBTCtoUSD: true } : g
              );
              console.log('Updated vatopGroups after setting supplicateWBTCtoUSD to true:', updatedGroups);

              // Save updated groups to backend
              saveVatopGroups({ email, vatopGroups: updatedGroups });
              return updatedGroups;
            });
          } catch (error) {
            console.error(`Error during WBTC to USDC supplication for group ${group.id}:`, error);
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
  
      // Skip if `supplicateWBTCtoUSD` is `true`
      if (group.supplicateWBTCtoUSD) {
        console.log(`Skipping supplication for group ${group.id} as supplicateWBTCtoUSD is true.`);
        return;
      }

  
      // Trigger USDC to WBTC supplication only if `cVactTaa` has increased
      if (group.cVactTaa > 0.000001 && (!prevGroup.cVactTaa || group.cVactTaa > prevGroup.cVactTaa)) {
        console.log(`Initiating USDC to WBTC supplication for amount: ${group.cVactTaa}`);
        const usdcEquivalent = getUSDCEquivalent(group.cVactTaa, bitcoinPrice);
        console.log(`Converted cVactDa ${group.cVactTaa} to WBTC equivalent: ${usdcEquivalent.toFixed(4)}`);
        try {
          await handleUSDCsupplication(group);
  
          // If successful, update the group state
          setVatopGroups((prevGroups) => {
            const updatedGroups = prevGroups.map((g) =>
              g.id === group.id ? { ...g, supplicateUSDtoWBTC: true } : g
            );
            console.log('Updated vatopGroups after setting supplicateUSDtoWBTC to true:', updatedGroups);
  
            // Save updated groups to backend
            saveVatopGroups({ email, vatopGroups: updatedGroups });
            return updatedGroups;
          });
        } catch (error) {
          console.error(`Error during USD to WBTC supplication for group ${group.id}:`, error);
          // Handle error or provide feedback to the user
        }
        
      }
  
      // Trigger WBTC to USDC supplication only if `cVactDa` has increased
      if (group.cVactDa > 0.01 && (!prevGroup.cVactDa || group.cVactDa > prevGroup.cVactDa)) {
        console.log(`Initiating WBTC to USDC supplication for added group amount: ${group.cVactDa}`);

        // Convert cVactDa to WBTC equivalent
        const wbtcEquivalent = getWBTCEquivalent(group.cVactDa, bitcoinPrice);
        console.log(`Converted cVactDa ${group.cVactDa} to WBTC equivalent: ${wbtcEquivalent.toFixed(8)}`);

        try {
          // Perform the supplication using the converted WBTC equivalent
          await handleWBTCsupplication(group);

          // If successful, update the group state
          setVatopGroups((prevGroups) => {
            const updatedGroups = prevGroups.map((g) =>
              g.id === group.id ? { ...g, supplicateWBTCtoUSD: true } : g
            );
            console.log('Updated vatopGroups after setting supplicateWBTCtoUSD to true:', updatedGroups);

            // Save updated groups to backend
            saveVatopGroups({ email, vatopGroups: updatedGroups });
            return updatedGroups;
          });
        } catch (error) {
          console.error(`Error during WBTC to USDC supplication for group ${group.id}:`, error);
          // Handle error or provide feedback to the user
        }
      }
    });
  
    setPrevVatopGroups([...vatopGroups]); // Update previous groups
  }, [vatopGroups]);








  const resetSupplicateWBTCtoUSD = async () => {
    try {
      const updatedGroups = vatopGroups.map((group) => ({
        ...group,
        supplicateWBTCtoUSD: false,
        supplicateUSDtoWBTC: false,
      }));
  
      setVatopGroups(updatedGroups); // Update local state
  
      // Use a callback to ensure updated state is passed
      setTimeout(async () => {
        console.log('Reset supplicateWBTCtoUSD to false for all groups:', updatedGroups);
        await saveVatopGroups({ email, vatopGroups: updatedGroups });
        console.log('Changes saved to backend successfully.');
      }, 0);
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
    resetSupplicateWBTCtoUSD, // Use the actual function
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