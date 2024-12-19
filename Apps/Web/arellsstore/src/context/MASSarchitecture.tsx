'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import axios from 'axios';

interface MASSarchitectureType {
  cVactTaa: number;
  cVactDa: number;
}

interface VatopGroup {
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
    if (!email) return;
  
    const fetchVatopGroups = async () => {
      try {
        const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
        const fetchedVatopGroups = response.data.vatopGroups || [];
  
        // Initialize or retain `supplicateWBTCtoUSD`
        const initializedGroups = fetchedVatopGroups.map((group: VatopGroup) => ({
          ...group,
          supplicateWBTCtoUSD: group.supplicateWBTCtoUSD ?? false,
        }));
  
        setVatopGroups(initializedGroups);
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };
  
    const intervalId = setInterval(fetchVatopGroups, 10000);
    fetchVatopGroups();
  
    return () => clearInterval(intervalId);
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
  
        // Log before updating
        console.log(`Setting supplicateWBTCtoUSD to true for group with cVactTa: ${group.cVactTa}`);
        setVatopGroups((prevGroups) => {
          const updatedGroups = prevGroups.map((g) =>
            g.cVactTa === group.cVactTa ? { ...g, supplicateWBTCtoUSD: true } : g
          );
          console.log('Updated vatopGroups after setting supplicateWBTCtoUSD to true:', updatedGroups);
  
          // Save updated groups to the backend
          saveVatopGroups(updatedGroups);
  
          return updatedGroups;
        });
  
        // Reset `supplicateWBTCtoUSD` after 60 seconds
        setTimeout(() => {
          setVatopGroups((prevGroups) => {
            const updatedGroups = prevGroups.map((g) =>
              g.cVactTa === group.cVactTa ? { ...g, supplicateWBTCtoUSD: false } : g
            );
            console.log('Updated vatopGroups after resetting supplicateWBTCtoUSD to false:', updatedGroups);
  
            // Save updated groups to the backend
            saveVatopGroups(updatedGroups);
  
            return updatedGroups;
          });
        }, 10000); // Reset supplicateWBTCtoUSD to false after 60 seconds
      }
    });
  
    setPrevVatopGroups([...vatopGroups]);
  }, [vatopGroups]);
  
  const saveVatopGroups = async (updatedGroups: VatopGroup[]) => {
    try {
      const payload = {
        email,
        vatopGroups: updatedGroups,
      };
      await axios.post('/api/saveVatopGroups', payload);
      console.log('Updated vatopGroups saved to backend successfully');
    } catch (error) {
      console.error('Error saving vatopGroups to backend:', error);
    }
  };

  const supplicateUSDCintoWBTC = async (amount: number, group: VatopGroup) => {
    if (amount <= 0) {
      console.log('Supplication amount must be greater than 0. Skipping swap.');
      return;
    }
  };

  const supplicateWBTCintoUSDC = async (amount: number, group: VatopGroup) => {
    if (amount <= 0) {
      console.log('Supplication amount must be greater than 0. Skipping swap.');
      return;
    }
  };

  return (
    <MASSarchitecture.Provider value={{ cVactTaa: 0, cVactDa: 0 }}>
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