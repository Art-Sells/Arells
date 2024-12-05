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

  const FEE_PER_SWAP = 0.00016; // $0.00016 per swap or GWEI (denominated from Price Oracle API)
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
        setVatopGroups(fetchedVatopGroups);
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };

    // Read vatopGroups every 10 seconds
    const intervalId = setInterval(fetchVatopGroups, 10000);
    fetchVatopGroups();

    return () => clearInterval(intervalId);
  }, [email]);

  const handleSupplications = (amount: number, swapType: 'USDCtoWBTC' | 'WBTCtoUSDC', group: VatopGroup) => {
    const feeSpentPerGroup: Record<string, number> = {};
    let currentCdVatop = group.cdVatop;
    let currentCVact = group.cVact;
    const groupId = group.cpVatop;

    // Calculate safeguard limit (retain 99.99% of initial cVact)
    const minCVact = currentCVact * SAFEGUARD_THRESHOLD;

    // Stop swaps if cVact drops below the safeguard limit
    if (currentCVact < minCVact) {
      console.log(`Group ${groupId}: Swaps paused. cVact dropped below safeguard limit ($${minCVact}).`);
      return;
    }

    // Handle low cdVatop
    if (currentCdVatop < 0.01) {
      console.log(`Group ${groupId} has low cdVatop. Deducting fees from cVact.`);
      const shortfall = 0.01 - currentCdVatop;

      if (currentCVact >= shortfall) {
        currentCVact -= shortfall;
        console.log(`Group ${groupId}: Shortfall of $${shortfall} covered by cVact.`);
      } else {
        console.log(`Group ${groupId}: Insufficient cVact to cover shortfall. Skipping swap.`);
        return;
      }
    }

    // Deduct fees
    if (currentCdVatop >= FEE_PER_SWAP) {
      currentCdVatop -= FEE_PER_SWAP;
      console.log(`Group ${groupId}: Fee of $${FEE_PER_SWAP} deducted from cdVatop.`);
    } else if (currentCVact >= FEE_PER_SWAP) {
      currentCVact -= FEE_PER_SWAP;
      console.log(`Group ${groupId}: Fee of $${FEE_PER_SWAP} deducted from cVact.`);
    } else {
      console.log(`Group ${groupId}: Insufficient funds to cover fees. Skipping swap.`);
      return;
    }

    console.log(`Group ${groupId}: Running ${swapType} swap for amount: $${amount}.`);
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
        console.log(`Initiating USDC to WBTC supplication for amount: ${group.cVactTaa}`);
        supplicateUSDCintoWBTC(group.cVactTaa, group);
      }

      if (group.cVactDa > 0.01 && (!prevGroup.cVactDa || group.cVactDa > prevGroup.cVactDa)) {
        console.log(`Initiating WBTC to USDC supplication for amount: ${group.cVactDa}`);
        supplicateWBTCintoUSDC(group.cVactDa, group);
      }
    });

    setPrevVatopGroups([...vatopGroups]);
  }, [vatopGroups]);

  const supplicateUSDCintoWBTC = async (amount: number, group: VatopGroup) => {
    if (amount <= 0) {
      console.log('Supplication amount must be greater than 0. Skipping swap.');
      return;
    }
    console.log(`Supplicating ${amount} USDC to WBTC`);
    handleSupplications(amount, 'USDCtoWBTC', group);
  };

  const supplicateWBTCintoUSDC = async (amount: number, group: VatopGroup) => {
    if (amount <= 0) {
      console.log('Swap amount must be greater than 0. Skipping swap.');
      return;
    }
    console.log(`Supplicating ${amount} WBTC to USDC`);
    handleSupplications(amount, 'WBTCtoUSDC', group);
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