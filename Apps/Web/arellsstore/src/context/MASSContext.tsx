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
  const [cVactTaa, setCVactTaa] = useState<number>(0);
  const [cVactDa, setCVactDa] = useState<number>(0);

  const [email, setEmail] = useState<string>('');
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);

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

  // Fetch VatopGroups based on email
  useEffect(() => {
    const fetchVatopGroups = async () => {
      try {
        if (!email) {
          console.warn('No email provided, skipping fetchVatopGroups');
          return;
        }
  
        const response = await axios.get('/api/fetchVatopGroups', { params: { email } });
        const fetchedVatopGroups = response.data.vatopGroups || [];
  
        // Ensure no duplicate or redundant groups
        const uniqueVatopGroups = fetchedVatopGroups.filter(
          (group: VatopGroup, index: number, self: VatopGroup[]) =>
            index === self.findIndex((g) => g.cpVatop === group.cpVatop && g.cVactTa === group.cVactTa)
        );
  
        setVatopGroups(uniqueVatopGroups);
  
        // Calculate totals
        const totalCVactTaa = uniqueVatopGroups.reduce(
          (sum: number, group: VatopGroup) => sum + (group.cVactTaa || 0),
          0
        );
        const totalCVactDa = uniqueVatopGroups.reduce(
          (sum: number, group: VatopGroup) => sum + (group.cVactDa || 0),
          0
        );
  
        setCVactTaa(totalCVactTaa);
        setCVactDa(totalCVactDa);
  
        console.log('Fetched vatopGroups:', uniqueVatopGroups);
        console.log('Updated cVactTaa:', totalCVactTaa, 'Updated cVactDa:', totalCVactDa);
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };
  
    fetchVatopGroups();
  }, [email]);

  // Swap functions
  const swapWBTC = async () => {
    console.log('Initiating WBTC swap');
    // Logic for WBTC swap will go here
  };

  const swapUSDC = async () => {
    console.log('Initiating USDC swap');
    // Logic for USDC swap will go here
  };

  // Monitor cVactTaa for changes and trigger swap logic
  useEffect(() => {
    if (cVactTaa > 0) {
      swapWBTC();
    }
  }, [cVactTaa]);

  // Monitor cVactDa for changes and trigger swap logic
  useEffect(() => {
    if (cVactDa > 0) {
      swapUSDC();
    }
  }, [cVactDa]);

  return (
    <MASSContext.Provider value={{ cVactTaa, cVactDa }}>
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