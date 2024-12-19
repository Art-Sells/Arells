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
  }) => {
    try {
      const payload = { email, vatopGroups };
      console.log('Saving vatopGroups:', payload);
      await axios.post('/api/saveVatopGroups', payload);
      console.log('VatopGroups saved successfully.');
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
    const prevIds = prevVatopGroups.map((group) => group.cpVatop);
    const currentIds = vatopGroups.map((group) => group.cpVatop);
  
    const addedGroups = vatopGroups.filter((group) => !prevIds.includes(group.cpVatop));
    const deletedGroups = prevVatopGroups.filter((group) => !currentIds.includes(group.cpVatop));
  
    if (addedGroups.length > 0 || deletedGroups.length > 0) {
      console.log('Groups were added or deleted, skipping swaps.');
      setPrevVatopGroups([...vatopGroups]);
      return;
    }
  
    vatopGroups.forEach((group, index) => {
      const prevGroup = prevVatopGroups[index] || {};
  
      if (group.cVactTaa > 0.00001 && (!prevGroup.cVactTaa || group.cVactTaa > prevGroup.cVactTaa)) {
        console.log(`Initiating USDC to WBTC supplication for amount: ${group.cVactTaa}`);
        supplicateUSDCintoWBTC(group.cVactTaa, group);
      }
  
      if (group.cVactDa > 0.01 && (!prevGroup.cVactDa || group.cVactDa > prevGroup.cVactDa)) {
        console.log(`Initiating WBTC to USDC supplication for amount: ${group.cVactDa}`);
        supplicateWBTCintoUSDC(group.cVactDa, group);
  
        setVatopGroups((prevGroups) => {
          const updatedGroups = prevGroups.map((g) =>
            g.cVactTa === group.cVactTa ? { ...g, supplicateWBTCtoUSD: true } : g
          );
          console.log('Updated vatopGroups after setting supplicateWBTCtoUSD to true:', updatedGroups);
  
          // Pass email explicitly with updatedGroups
          saveVatopGroups({ email, vatopGroups: updatedGroups }); 
          return updatedGroups;
        });
      }
    });
  
    setPrevVatopGroups([...vatopGroups]);
  }, [vatopGroups]);

  const resetSupplicateWBTCtoUSD = async () => {
    const updatedGroups = vatopGroups.map((group) => ({ ...group, supplicateWBTCtoUSD: false }));
    setVatopGroups(updatedGroups);
  
    console.log('Reset supplicateWBTCtoUSD to false for all groups.');
  
    try {
      await saveVatopGroups({ email, vatopGroups: updatedGroups });
    } catch (error) {
      console.error('Error saving vatopGroups:', error);
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
    cVactTaa: vatopGroups.reduce((sum, group) => sum + group.cVactTaa, 0), // Sum up all `cVactTaa` values
    cVactDa: vatopGroups.reduce((sum, group) => sum + group.cVactDa, 0), // Sum up all `cVactDa` values
    resetSupplicateWBTCtoUSD: async () => {
      setVatopGroups((prevGroups) =>
        prevGroups.map((group) => ({ ...group, supplicateWBTCtoUSD: false }))
      );
      console.log('Reset supplicateWBTCtoUSD for all groups.');
    },
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