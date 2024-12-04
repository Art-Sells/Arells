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
}

const MASSarchitecture = createContext<MASSarchitectureType | undefined>(undefined);

export const MASSProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);
  const [prevVatopGroups, setPrevVatopGroups] = useState<VatopGroup[]>([]);

  const FEE_PER_SWAP = 0.00016; // $0.00016 per swap
  const MAX_FEE_PER_GROUP = 0.01; // Maximum fee per group before pausing swaps
  const SAFEGUARD_THRESHOLD = 0.9999; // Retain 99.99% of initial cVact

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
        setVatopGroups(fetchedVatopGroups); // Only updates state, no filtering
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };

    const intervalId = setInterval(fetchVatopGroups, 10000);
    fetchVatopGroups();

    return () => clearInterval(intervalId);
  }, [email]);

  const handleSwaps = (amount: number, swapType: 'USDCtoWBTC' | 'WBTCtoUSDC', group: VatopGroup) => {
    const groupId = group.cpVatop;

    console.log(
      `Group ${groupId}: Running ${swapType} swap for amount $${amount}.`
    );
  };

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
        console.log(`Initiating USDC to WBTC swap for amount: ${group.cVactTaa}`);
        handleSwaps(group.cVactTaa, 'USDCtoWBTC', group);
      }

      if (group.cVactDa > 0.01 && (!prevGroup.cVactDa || group.cVactDa > prevGroup.cVactDa)) {
        console.log(`Initiating WBTC to USDC swap for amount: ${group.cVactDa}`);
        handleSwaps(group.cVactDa, 'WBTCtoUSDC', group);
      }
    });

    setPrevVatopGroups([...vatopGroups]); // Only for comparison, no modifications
  }, [vatopGroups]);

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