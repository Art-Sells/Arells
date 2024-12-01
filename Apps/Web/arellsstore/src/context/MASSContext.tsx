'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import axios from 'axios';

interface MASSContextType {
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
}

const MASSContext = createContext<MASSContextType | undefined>(undefined);

export const MASSProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [prevVatopGroups, setPrevVatopGroups] = useState<VatopGroup[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true); // Track initial load

  // Fetch email on mount
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

  // Fetch VatopGroups every 3 seconds
  useEffect(() => {
    if (!email) return;

    const fetchVatopGroups = async () => {
      try {
        const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
        const fetchedVatopGroups = response.data.vatopGroups || [];

        // Ensure no duplicate or redundant groups
        const uniqueVatopGroups = fetchedVatopGroups.filter(
          (group: VatopGroup, index: number, self: VatopGroup[]) =>
            index === self.findIndex((g) => g.cpVatop === group.cpVatop && g.cVactTa === group.cVactTa)
        );

        setVatopGroups(uniqueVatopGroups);
        console.log('Fetched vatopGroups:', uniqueVatopGroups);

        if (isInitialLoad) {
          setPrevVatopGroups(uniqueVatopGroups); // Initialize prevVatopGroups on first load
          setIsInitialLoad(false); // Mark initial load as complete
        }
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };

    fetchVatopGroups(); // Fetch initially

    const intervalId = setInterval(fetchVatopGroups, 3000); // Fetch every 3 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [email, isInitialLoad]);

  // Swap functions
  const swapUSDCintoWBTC = async (amount: number) => {
    console.log(`Initiating USDC to WBTC swap for amount: ${amount}`);
    // Logic for USDC to WBTC swap goes here
  };

  const swapWBTCintoUSDC = async (amount: number) => {
    console.log(`Initiating WBTC to USDC swap for amount: ${amount}`);
    // Logic for WBTC to USDC swap goes here
  };

  // Monitor VatopGroups for changes and perform swaps
  useEffect(() => {
    if (isInitialLoad) return; // Prevent swaps on initial load

    const prevIds = prevVatopGroups.map((group) => group.cpVatop);
    const currentIds = vatopGroups.map((group) => group.cpVatop);

    const addedGroups = vatopGroups.filter((group) => !prevIds.includes(group.cpVatop));
    const deletedGroups = prevVatopGroups.filter((group) => !currentIds.includes(group.cpVatop));

    if (addedGroups.length > 0 || deletedGroups.length > 0) {
      console.log('Groups were added or deleted, skipping swaps.');
      setPrevVatopGroups([...vatopGroups]); // Update previous groups
      return; // Skip swap logic
    }

    vatopGroups.forEach((group, index) => {
      const prevGroup = prevVatopGroups[index] || {};

      // Check for cVactTaa swap condition
      if (group.cVactTaa > 0.00001 && (!prevGroup.cVactTaa || group.cVactTaa > prevGroup.cVactTaa)) {
        swapUSDCintoWBTC(group.cVactTaa);
      }

      // Check for cVactDa swap condition
      if (group.cVactDa > 0.01 && (!prevGroup.cVactDa || group.cVactDa > prevGroup.cVactDa)) {
        swapWBTCintoUSDC(group.cVactDa);
      }
    });

    setPrevVatopGroups([...vatopGroups]); // Update previous groups
  }, [vatopGroups, isInitialLoad]);

  return (
    <MASSContext.Provider value={{ cVactTaa: 0, cVactDa: 0 }}>
      {children}
    </MASSContext.Provider>
  );
};

export const useMASS = () => {
  const context = useContext(MASSContext);
  if (!context) {
    throw new Error('useMASS must be used within a MASSProvider');
  }
  return context;
};