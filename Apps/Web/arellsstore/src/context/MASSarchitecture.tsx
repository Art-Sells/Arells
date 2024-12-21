'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useHPM } from './HPMarchitecture';

interface MASSarchitectureType {
  cVactTaa: number;
  cVactDa: number;
  resetSupplicateWBTCtoUSD: () => void;
  refreshVatopGroups: () => void;
}

interface VatopGroup {
  id: string; 
  cVatop: number;
  cpVatop: number;
  cVact: number;
  cpVact: number;
  cVactTa: number;
  cVactDa: number;
  cVactTaa: number;
  cdVatop: number;
  supplicateWBTCtoUSD: boolean;
  HAP: number;
}

const MASSarchitecture = createContext<MASSarchitectureType | undefined>(undefined);

export const MASSProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [prevVatopGroups, setPrevVatopGroups] = useState<VatopGroup[]>([]);
  const [supplicateState, setSupplicateState] = useState<Record<string, boolean>>({});
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

  const saveVatopGroups = async ({
    email,
    vatopGroups,
  }: {
    email: string;
    vatopGroups: VatopGroup[];
  }) =>  {
    try {
      // Prepare minimal data for payload
      const minimalVatopGroups = vatopGroups.map(({ id, cVactTa, cpVatop, HAP, supplicateWBTCtoUSD }) => ({
        id,
        cVactTa,
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
  
      addedGroups.forEach((group) => {
        // Ensure `supplicateWBTCtoUSD` is `false` during initialization
        if (group.supplicateWBTCtoUSD) {
          console.log(`Skipping added group ${group.id} as supplicateWBTCtoUSD is true.`);
          return;
        }
  
        // Only allow WBTC to USDC supplication for added groups
        if (group.cVactDa > 0.01) {
          console.log(`Initiating WBTC to USDC supplication for added group amount: ${group.cVactDa}`);
          supplicateWBTCintoUSDC(group.cVactDa, group);
        } else {
          console.log(`No WBTC to USDC supplication required for added group ${group.id}.`);
        }
      });
  
      setPrevVatopGroups([...vatopGroups]); // Update the state for tracking
      return; // Exit early, skipping further processing
    }
  
    // Process existing groups
    vatopGroups.forEach((group, index) => {
      const prevGroup = prevVatopGroups[index] || {};
  
      // Skip if `supplicateWBTCtoUSD` is `true`
      if (group.supplicateWBTCtoUSD) {
        console.log(`Skipping supplication for group ${group.id} as supplicateWBTCtoUSD is true.`);
        return;
      }
  
      // Trigger USDC to WBTC supplication only if `cVactTaa` has increased
      if (group.cVactTaa > 0.00001 && (!prevGroup.cVactTaa || group.cVactTaa > prevGroup.cVactTaa)) {
        console.log(`Initiating USDC to WBTC supplication for amount: ${group.cVactTaa}`);
        supplicateUSDCintoWBTC(group.cVactTaa, group);
      }
  
      // Trigger WBTC to USDC supplication only if `cVactDa` has increased
      if (group.cVactDa > 0.01 && (!prevGroup.cVactDa || group.cVactDa > prevGroup.cVactDa)) {
        console.log(`Initiating WBTC to USDC supplication for amount: ${group.cVactDa}`);
        supplicateWBTCintoUSDC(group.cVactDa, group);
  
        // Set `supplicateWBTCtoUSD` to `true` for the group
        setVatopGroups((prevGroups) => {
          const updatedGroups = prevGroups.map((g) =>
            g.id === group.id ? { ...g, supplicateWBTCtoUSD: true } : g
          );
          console.log('Updated vatopGroups after setting supplicateWBTCtoUSD to true:', updatedGroups);
  
          // Save updated groups to backend
          saveVatopGroups({ email, vatopGroups: updatedGroups });
          return updatedGroups;
        });
      }
    });
  
    setPrevVatopGroups([...vatopGroups]); // Update previous groups
  }, [vatopGroups]);

  const resetSupplicateWBTCtoUSD = async () => {
    try {
      const updatedGroups = vatopGroups.map((group) => ({
        ...group,
        supplicateWBTCtoUSD: false,
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

  const toggleSupplicateWBTCtoUSD = (groupId: string, value: boolean) => {
    setVatopGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, supplicateWBTCtoUSD: value } : group
      )
    );
  };

  const supplicateUSDCintoWBTC = async (amount: number, group: VatopGroup) => {
    if (amount <= 0) {
      console.log('Supplication amount must be greater than 0. Skipping.');
      return;
    }
    console.log(`Supplicating USDC into WBTC for amount: ${amount}`);
    toggleSupplicateWBTCtoUSD(group.id, true);
    // Add your logic here (e.g., calling an API or updating state).
  };

  const supplicateWBTCintoUSDC = async (amount: number, group: VatopGroup) => {
    if (amount <= 0) {
      console.log('Supplication amount must be greater than 0. Skipping.');
      return;
    }
    console.log(`Supplicating WBTC into USDC for amount: ${amount}`);
    // Add your logic here (e.g., calling an API or updating state).
  };

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