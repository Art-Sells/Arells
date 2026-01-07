'use client';

import { useUser } from './UserContext';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchEthereumPrice, setManualEthereumPrice as setManualEthereumPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { fetchBalance } from '../lib/fetchBalance';

interface VatocState {
  cVatoc: number; // Value of the asset investment at the time of connect
  cpVatoc: number; // Asset price at the time of connect
  cdVatoc: number; // Difference between cVact and cVatoc: cdVatoc = cVact - cVatoc
}

interface VactState {
  cVact: number; // Current value of the asset investment
  cpVact: number; // Current price of the asset (VAPA)
  cVactTaa: number; // Token amount of the asset available
}

interface TotalsState {
  acVatoc: number; // Combination of all the cVatocs
  acdVatoc: number; // Combination of all the cdVatocs
  acVact: number; // Combination of all cVacts
  acVactTaa: number; // Combination of all cVactTaas
}

interface VavityaggregatorType {
  assetPrice: number;
  vatoc: VatocState;
  vact: VactState;
  totals: TotalsState;
  vapa: number; // Valued Asset Price Anchored (highest asset price recorded always)
  vatopCombinations: { acVatops: number; acVacts: number; acdVatops: number }; // Alias for totals (legacy compatibility)
  vavityPrice: number; // Alias for vapa (legacy compatibility)
  connectAmount: number;
  setConnectAmount: (amount: number) => void;
  handleConnect: (amount: number) => void;
  handleConnectASSET: (amount: number) => void;
  setManualAssetPrice: (price: number | ((currentPrice: number) => number)) => void;
  email: string;
  readASSETFile: () => Promise<number | null>;
  updateASSETFile: (amount: number) => Promise<number>;
  fetchVavityAggregator: (email: string) => Promise<any>;
  addVavityAggregator: (email: string, newWallets: any[]) => Promise<any>;
  saveVavityAggregator: (email: string, wallets: any[], vavityCombinations: any, balances?: any[], globalVapa?: number) => Promise<any>;
}

const Vavityaggregator = createContext<VavityaggregatorType | undefined>(undefined);

export const VavityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string>('');
  const [assetPrice, setAssetPrice] = useState<number>(0);
  const [connectAmount, setConnectAmount] = useState<number>(0);
  
  // Fetch Ethereum price on mount and periodically
  // assetPrice = current Ethereum price
  // VAPA = highest Ethereum price ever from historical data
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch current Ethereum price
        const currentPriceResponse = await axios.get('/api/fetchEthereumPrice');
        const currentPrice = currentPriceResponse.data?.['ethereum']?.usd;
        if (currentPrice) {
          setAssetPrice(currentPrice);
        }

        // Fetch VAPA from global /api/vapa endpoint (persistent, never decreases)
        // VAPA is now global and doesn't depend on user email
        // This is the SINGLE SOURCE OF TRUTH for VAPA - always use it directly
        try {
          const vapaResponse = await axios.get('/api/vapa');
          const persistentVapa = vapaResponse.data?.vapa;
          if (persistentVapa !== undefined && persistentVapa !== null) {
            // Always use the global VAPA value directly (don't use Math.max with prev)
            // The global VAPA is already the highest value, so we should trust it
            setVapa(persistentVapa);
          }
        } catch (error) {
          // Fallback to highest price ever if VAPA API doesn't exist yet
          try {
            const highestPriceResponse = await axios.get('/api/fetchHighestEthereumPrice');
        const highestPriceEver = highestPriceResponse.data?.highestPriceEver;
        if (highestPriceEver) {
              setVapa(highestPriceEver);
            }
          } catch (fallbackError) {
            // If both fail, keep current VAPA or use assetPrice as last resort
            console.warn('[VavityAggregator] Could not fetch VAPA from any source');
          }
        }
      } catch (error) {
        // console.error('Error fetching Ethereum prices:', error);
        // Keep default price on error
      }
    };

    fetchPrices(); // Initial fetch
    const interval = setInterval(fetchPrices, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, []); // VAPA is now global, no email dependency
  
  // Single aggregated state instead of groups
  const [vatoc, setVatoc] = useState<VatocState>({
    cVatoc: 0,
    cpVatoc: 0,
    cdVatoc: 0,
  });

  const [vact, setVact] = useState<VactState>({
    cVact: 0,
    cpVact: 0,
    cVactTaa: 0,
  });

  const [totals, setTotals] = useState<TotalsState>({
    acVatoc: 0,
    acdVatoc: 0,
    acVact: 0,
    acVactTaa: 0,
  });

  const [vapa, setVapa] = useState<number>(0);

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const attributesResponse = await fetchUserAttributes();
        const emailAttribute = attributesResponse.email;
        if (emailAttribute) {
          setEmail(emailAttribute);
        }
      } catch (error) {
        // console.error('Error fetching user attributes:', error);
      }
    };
    fetchEmail();
  }, []);

  useEffect(() => {
    const fetchVatocState = async () => {
      try {
        if (!email) {
          // console.warn('No email provided, skipping fetchVatocState');
          return;
        }
  
        const response = await axios.get('/api/fetchVatocState', { params: { email } });
        const fetchedVatoc = response.data.vatoc || { cVatoc: 0, cpVatoc: 0, cdVatoc: 0 };
        const fetchedVact = response.data.vact || { cVact: 0, cpVact: 0, cVactTaa: 0 };
        // Don't set VAPA from fetchVatocState - VAPA should only come from global /api/vapa endpoint
        // const fetchedVapa = response.data.vapa || assetPrice;
  
        setVatoc(fetchedVatoc);
        setVact(fetchedVact);
        // VAPA is now managed separately via global /api/vapa endpoint (see useEffect above)
        // setVapa(fetchedVapa);
      } catch (error) {
        // console.error('Error fetching vatoc state:', error);
      }
    };
  
    fetchVatocState();
  }, [email, assetPrice]);

  // VAPA is now managed exclusively by the global /api/vapa endpoint
  // This useEffect is removed - VAPA should only be updated via the global endpoint
  // useEffect(() => {
  //   if (vact.cpVact > 0) {
  //     setVapa(Math.max(vapa, vact.cpVact, assetPrice));
  //   } else {
  //     setVapa(assetPrice); // Default to current Asset price if no assets exist
  //   }
  // }, [vact.cpVact, assetPrice]);

  // Update cdVatoc when cVact or cVatoc changes
  useEffect(() => {
    const newCdVatoc = vact.cVact - vatoc.cVatoc;
    setVatoc((prev) => ({
      ...prev,
      cdVatoc: parseFloat(newCdVatoc.toFixed(2)),
    }));
  }, [vact.cVact, vatoc.cVatoc]);

  // Update totals when vatoc or vact changes
  useEffect(() => {
    setTotals({
      acVatoc: vatoc.cVatoc,
      acdVatoc: vatoc.cdVatoc,
      acVact: vact.cVact,
      acVactTaa: vact.cVactTaa,
    });
  }, [vatoc.cVatoc, vatoc.cdVatoc, vact.cVact, vact.cVactTaa]);

  // Update cpVact based on VAPA (highest asset price recorded always)
  useEffect(() => {
    const newCpVact = Math.max(vact.cpVact, assetPrice);
    if (newCpVact !== vact.cpVact) {
      const newCVact = vact.cVactTaa * newCpVact;
      setVact((prev) => ({
        ...prev,
        cpVact: newCpVact,
        cVact: parseFloat(newCVact.toFixed(2)),
      }));
    }
  }, [assetPrice, vact.cVactTaa]);

  const updateAllState = async (
    newAssetPrice: number,
    updatedVatoc: VatocState,
    updatedVact: VactState,
    email: string
  ) => {
    // Ensure cpVact only increases (VAPA behavior)
    const newCpVact = Math.max(updatedVact.cpVact, newAssetPrice);
    const newCVact = updatedVact.cVactTaa * newCpVact;
    const newVapa = Math.max(vapa, newCpVact);

    const finalVact: VactState = {
      cVact: parseFloat(newCVact.toFixed(2)),
      cpVact: newCpVact,
      cVactTaa: updatedVact.cVactTaa,
    };

    const finalVatoc: VatocState = {
      ...updatedVatoc,
      cdVatoc: parseFloat((newCVact - updatedVatoc.cVatoc).toFixed(2)),
    };

    setVact(finalVact);
    setVatoc(finalVatoc);
    setVapa(newVapa);

    try {
      await axios.post('/api/saveVatocState', {
        email,
        vatoc: finalVatoc,
        vact: finalVact,
        vapa: newVapa,
      });
    } catch (error) {
      // console.error("Error saving vatoc state:", error);
    }
  };

  const setManualAssetPrice = async (
    price: number | ((currentPrice: number) => number)
  ) => {
    const newPrice = typeof price === "function" ? price(assetPrice) : price;
  
    setAssetPrice(newPrice);
  
    // Update cpVact to be max of current cpVact and new price (VAPA behavior)
    const newCpVact = Math.max(vact.cpVact, newPrice);
    const newCVact = vact.cVactTaa * newCpVact;
  
    const updatedVact: VactState = {
      cVact: parseFloat(newCVact.toFixed(2)),
      cpVact: newCpVact,
      cVactTaa: vact.cVactTaa,
    };
  
    await updateAllState(newPrice, vatoc, updatedVact, email);
  };

  const readASSETFile = async (): Promise<number | null> => {
    try {
      if (!email) {
        // Email not set yet, return null silently (not an error)
        return null;
      }
      
      const response = await axios.get('/api/readASSET', { params: { email } });
      return response.data.aASSET || 0;
    } catch (error: any) {
      // If file doesn't exist (404), that's normal for new users
      if (error?.response?.status === 404) {
        return 0; // Return 0 instead of null for new users
      }
      // Only log actual errors, not missing files
      if (error?.response?.status !== 404) {
      // console.error('Error reading aASSET.json:', error);
      }
      return null;
    }
  };

  const updateASSETFile = async (amount: number): Promise<number> => {
    try {
      if (!email) throw new Error("Email is not set in context.");
      
      const response = await axios.post('/api/saveASSET', { email, amount });
  
      return response.data.aASSET;
    } catch (error) {
      // console.error('Error updating aASSET.json:', error);
      throw error;
    }
  };

  let isUpdating = false;

  const handleConnect = async (amount: number) => {
    if (isUpdating) {
      return;
    }

    // Skip if email is not set yet
    if (!email) {
      return;
    }
  
    isUpdating = true;
  
    try {
      const aASSET = await readASSETFile();
  
      // If aASSET is null, it means there was an error or email not set - skip silently
      if (aASSET === null) {
        return;
      }
  
      const currentVactTaa = vact.cVactTaa || 0;
  
      if (aASSET - currentVactTaa < 0.00001) {
        return;
      }
  
      if (aASSET > currentVactTaa) {
        const amountToConnect = parseFloat((aASSET - currentVactTaa).toFixed(8));
        const connectValue = amountToConnect * assetPrice;
  
        // Update Vatoc: accumulate the connect value
        const newCVatoc = vatoc.cVatoc + connectValue;
        // cpVatoc should always be VAPA at time of connection
        const currentVapa = Math.max(vapa || 0, assetPrice || 0);
        const newCpVatoc = vatoc.cpVatoc === 0 ? currentVapa : vatoc.cpVatoc;
  
        // Update Vact: add tokens and recalculate value
        const newCVactTaa = vact.cVactTaa + amountToConnect;
        const newCpVact = Math.max(vact.cpVact, assetPrice); // VAPA behavior
        const newCVact = newCVactTaa * newCpVact;
  
        const updatedVatoc: VatocState = {
          cVatoc: parseFloat(newCVatoc.toFixed(2)),
          cpVatoc: newCpVatoc,
          cdVatoc: 0, // Will be recalculated
        };
  
        const updatedVact: VactState = {
          cVact: parseFloat(newCVact.toFixed(2)),
          cpVact: newCpVact,
          cVactTaa: parseFloat(newCVactTaa.toFixed(8)),
        };
  
        await updateAllState(assetPrice, updatedVatoc, updatedVact, email);
      }
    } catch (error) {
      // console.error("Error during handleConnect:", error);
    } finally {
      isUpdating = false;
    }
  };

  // Disabled aASSET.json reading - not needed for wallet creation
  // useEffect(() => {
  //   // Don't start interval if email is not set
  //   if (!email) {
  //     return;
  //   }

  //   let isSyncing = false;
  
  //   const interval = setInterval(async () => {
  //     if (isSyncing || !email) return;
  
  //     isSyncing = true;
  
  //     try {
  //       await readASSETFile();
  //       await handleConnect(0); // Trigger connect check
  //     } catch (error) {
  //       // Silently handle errors - don't spam console
  //       // console.error("Error in interval execution:", error);
  //     } finally {
  //       isSyncing = false;
  //     }
  //   }, 3000);
  
  //   return () => clearInterval(interval);
  // }, [vact.cVactTaa, email]);

  const handleConnectASSET = async (amount: number) => {
    if (amount < 0.0001) {
      alert('The minimum connect amount is 0.0001 ASSET.');
      return;
    }
    try {
      await axios.post('/api/saveASSET', { email, amount });
    } catch (error) {
      // console.error('Error saving to aASSET.json:', error);
    }
  };

  const saveVatocState = async ({
    email,
    vatoc,
    vact,
    vapa,
  }: {
    email: string;
    vatoc: VatocState;
    vact: VactState;
    vapa: number;
  }) => {
    try {
      const payload = {
        email,
        vatoc,
        vact,
        vapa,
      };
  
      await axios.post('/api/saveVatocState', payload);
    } catch (error) {
      // console.error('Error saving vatoc state:', error);
    }
  };

  const fetchVavityAggregator = useCallback(async (email: string): Promise<any> => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      const response = await axios.get(`/api/fetchVavityAggregator`, { params: { email } });
      return response.data;
    } catch (error) {
      // console.error('Error fetching Vavity Aggregator data:', error);
      throw error;
    }
  }, []);

  const addVavityAggregator = useCallback(async (email: string, newWallets: any[]): Promise<any> => {
    try {
      if (!email || !Array.isArray(newWallets) || newWallets.length === 0) {
        throw new Error('Email and non-empty newWallets array are required');
      }
      const response = await axios.post('/api/addVavityAggregator', {
        email,
        newWallets,
      });
      return response.data;
    } catch (error) {
      // console.error('Error adding Vavity Aggregator data:', error);
      throw error;
    }
  }, []);

  const saveVavityAggregator = useCallback(async (email: string, wallets: any[], vavityCombinations: any, balances?: any[], globalVapa?: number): Promise<any> => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      // console.log('[VavityAggregator] Saving wallets:', wallets.length, 'wallets');
      const response = await axios.post('/api/saveVavityAggregator', {
        email,
        wallets,
        vavityCombinations,
        balances,
        globalVapa,
      });
      // console.log('[VavityAggregator] Successfully saved wallets');
      return response.data;
    } catch (error) {
      // console.error('Error saving Vavity Aggregator data:', error);
      throw error;
    }
  }, []);

  // Fetch and update balances for all wallet addresses
  useEffect(() => {
    if (!email) {
      // console.log('[VavityAggregator] Balance fetch useEffect: No email, skipping');
      return;
    }

    // console.log('[VavityAggregator] Balance fetch useEffect: Starting balance fetch');
    const fetchWalletBalances = async () => {
      try {
        // console.log('[VavityAggregator] Calling fetchBalance...');
        await fetchBalance({
          email,
          assetPrice,
          fetchVavityAggregator,
          saveVavityAggregator,
        });
        // console.log('[VavityAggregator] fetchBalance completed');
      } catch (error) {
        // console.error('[VavityAggregator] Error in fetchWalletBalances:', error);
      }
    };

    // Run immediately
    fetchWalletBalances();
    // Update balances every 5 seconds
    const interval = setInterval(fetchWalletBalances, 5000);
    return () => {
      // console.log('[VavityAggregator] Cleaning up balance fetch interval');
      clearInterval(interval);
    };
  }, [email, assetPrice, fetchVavityAggregator, saveVavityAggregator]);

  return (
    <Vavityaggregator.Provider
      value={{
        assetPrice,
        vatoc,
        vact,
        totals,
        vapa,
        vatopCombinations: {
          acVatops: totals.acVatoc,
          acVacts: totals.acVact,
          acdVatops: totals.acdVatoc
        },
        vavityPrice: vapa,
        connectAmount,
        setConnectAmount,
        handleConnect,
        handleConnectASSET,
        setManualAssetPrice,
        email,
        readASSETFile, 
        updateASSETFile,
        fetchVavityAggregator,
        addVavityAggregator,
        saveVavityAggregator
      }}
    >
      {children}
    </Vavityaggregator.Provider>
  );
};

export const useVavity = () => {
  const context = useContext(Vavityaggregator);
  if (context === undefined) {
    throw new Error('useVavity must be used within an VavityProvider');
  }
  return context;
};