'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import axios from 'axios';

interface MASSContextType {
  cVactTaa: number;
  cVactDa: number;
  setCVactTaa: (value: number) => void;
  setCVactDa: (value: number) => void;
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

interface MASSContextType {
  cVactTaa: number;
  cVactDa: number;
}

const MASSContext = createContext<MASSContextType | undefined>(undefined);

export const MASSProvider = ({ children }: { children: ReactNode }) => {
  const [cVactTaa, setCVactTaa] = useState<number>(0);
  const [cVactDa, setCVactDa] = useState<number>(0);

  const [prevCVactTaa, setPrevCVactTaa] = useState<number>(0);
  const [prevCVactDa, setPrevCVactDa] = useState<number>(0);

  const [email, setEmail] = useState<string>('');
  const [vatopGroups, setVatopGroups] = useState<VatopGroup[]>([]);

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
  
        setVatopGroups(uniqueVatopGroups); // Set only unique groups
  
      } catch (error) {
        console.error('Error fetching vatop groups:', error);
      }
    };
  
    fetchVatopGroups();
  }, [email]);

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
    if (prevCVactTaa === 0 && cVactTaa > 0) {
      swapWBTC();
    } else if (prevCVactTaa > 0 && cVactTaa === 0) {
      swapWBTC();
    }
    setPrevCVactTaa(cVactTaa);
  }, [cVactTaa, prevCVactTaa]);

  // Monitor cVactDa for changes and trigger swap logic
  useEffect(() => {
    if (prevCVactDa === 0 && cVactDa > 0) {
      swapUSDC();
    } else if (prevCVactDa > 0 && cVactDa === 0) {
      swapUSDC();
    }
    setPrevCVactDa(cVactDa);
  }, [cVactDa, prevCVactDa]);

  return (
    <MASSContext.Provider value={{ cVactTaa, cVactDa, setCVactTaa, setCVactDa }}>
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