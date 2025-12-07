'use client';

import { useUser } from './UserContext';
import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchBitcoinPrice, setManualBitcoinPrice as setManualBitcoinPriceApi } from '../lib/coingecko-api';
import { fetchUserAttributes } from 'aws-amplify/auth';

interface VatoiState {
  cVatoi: number; // Value of the asset investment at the time of import
  cpVatoi: number; // Asset price at the time of import
  cdVatoi: number; // Difference between cVact and cVatoi: cdVatoi = cVact - cVatoi
}

interface VactState {
  cVact: number; // Current value of the asset investment
  cpVact: number; // Current price of the asset (VAPA)
  cVactTaa: number; // Token amount of the asset available
}

interface TotalsState {
  acVatoi: number; // Combination of all the cVatois
  acdVatoi: number; // Combination of all the cdVatois
  acVact: number; // Combination of all cVacts
  acVactTaa: number; // Combination of all cVactTaas
}

interface VavityaggregatorType {
  assetPrice: number;
  vatoi: VatoiState;
  vact: VactState;
  totals: TotalsState;
  vapa: number; // Valued Asset Price Anchored (highest cpVact)
  importAmount: number;
  exportAmount: number;
  setImportAmount: (amount: number) => void;
  setExportAmount: (amount: number) => void;
  handleImport: (amount: number) => void;
  handleImportASSET: (amount: number) => void;
  handleExport: (amount: number) => void;
  setManualAssetPrice: (price: number | ((currentPrice: number) => number)) => void;
  exportedAmounts: number;
  email: string;
  readASSETFile: () => Promise<number | null>;
  updateASSETFile: (amount: number) => Promise<number>;
  fetchVavityAggregator: (email: string) => Promise<any>;
  addVavityAggregator: (email: string, newVatopGroups: any[]) => Promise<any>;
  saveVavityAggregator: (email: string, vatopGroups: any[], vatopCombinations: any) => Promise<any>;
}

const Vavityaggregator = createContext<VavityaggregatorType | undefined>(undefined);

export const VavityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string>('');
  const [assetPrice, setAssetPrice] = useState<number>(60000);
  const [importAmount, setImportAmount] = useState<number>(0);
  const [exportAmount, setExportAmount] = useState<number>(0);
  const [exportedAmounts, setExportedAmounts] = useState<number>(0);
  
  // Single aggregated state instead of groups
  const [vatoi, setVatoi] = useState<VatoiState>({
    cVatoi: 0,
    cpVatoi: 0,
    cdVatoi: 0,
  });

  const [vact, setVact] = useState<VactState>({
    cVact: 0,
    cpVact: 0,
    cVactTaa: 0,
  });

  const [totals, setTotals] = useState<TotalsState>({
    acVatoi: 0,
    acdVatoi: 0,
    acVact: 0,
    acVactTaa: 0,
  });

  const [vapa, setVapa] = useState<number>(60000);

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
    const fetchVatoiState = async () => {
      try {
        if (!email) {
          console.warn('No email provided, skipping fetchVatoiState');
          return;
        }
  
        const response = await axios.get('/api/fetchVatoiState', { params: { email } });
        const fetchedVatoi = response.data.vatoi || { cVatoi: 0, cpVatoi: 0, cdVatoi: 0 };
        const fetchedVact = response.data.vact || { cVact: 0, cpVact: 0, cVactTaa: 0 };
        const fetchedVapa = response.data.vapa || assetPrice;
        const fetchedExportedAmounts = response.data.exportedAmounts || 0;
  
        setVatoi(fetchedVatoi);
        setVact(fetchedVact);
        setVapa(fetchedVapa);
        setExportedAmounts(fetchedExportedAmounts);
      } catch (error) {
        console.error('Error fetching vatoi state:', error);
      }
    };
  
    fetchVatoiState();
  }, [email, assetPrice]);

  // Update VAPA when cpVact changes
  useEffect(() => {
    if (vact.cpVact > 0) {
      setVapa(Math.max(vapa, vact.cpVact));
    } else {
      setVapa(assetPrice); // Default to current Asset price if no assets exist
    }
  }, [vact.cpVact, assetPrice]);

  // Update cdVatoi when cVact or cVatoi changes
  useEffect(() => {
    const newCdVatoi = vact.cVact - vatoi.cVatoi;
    setVatoi((prev) => ({
      ...prev,
      cdVatoi: parseFloat(newCdVatoi.toFixed(2)),
    }));
  }, [vact.cVact, vatoi.cVatoi]);

  // Update totals when vatoi or vact changes
  useEffect(() => {
    setTotals({
      acVatoi: vatoi.cVatoi,
      acdVatoi: vatoi.cdVatoi,
      acVact: vact.cVact,
      acVactTaa: vact.cVactTaa,
    });
  }, [vatoi.cVatoi, vatoi.cdVatoi, vact.cVact, vact.cVactTaa]);

  // Update cpVact based on VAPA (highest price observed)
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
    updatedVatoi: VatoiState,
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

    const finalVatoi: VatoiState = {
      ...updatedVatoi,
      cdVatoi: parseFloat((newCVact - updatedVatoi.cVatoi).toFixed(2)),
    };

    setVact(finalVact);
    setVatoi(finalVatoi);
    setVapa(newVapa);

    try {
      await axios.post('/api/saveVatoiState', {
        email,
        vatoi: finalVatoi,
        vact: finalVact,
        vapa: newVapa,
      });
    } catch (error) {
      console.error("Error saving vatoi state:", error);
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
  
    await updateAllState(newPrice, vatoi, updatedVact, email);
  };

  const readASSETFile = async (): Promise<number | null> => {
    try {
      if (!email) throw new Error("Email is not set in context.");
      
      const response = await axios.get('/api/readASSET', { params: { email } });
      return response.data.aASSET || 0;
    } catch (error) {
      console.error('Error reading aASSET.json:', error);
      return null;
    }
  };

  const updateASSETFile = async (amount: number): Promise<number> => {
    try {
      if (!email) throw new Error("Email is not set in context.");
      
      const response = await axios.post('/api/saveASSET', { email, amount });
  
      return response.data.aASSET;
    } catch (error) {
      console.error('Error updating aASSET.json:', error);
      throw error;
    }
  };

  let isUpdating = false;

  const handleImport = async (amount: number) => {
    if (isUpdating) {
      return;
    }
  
    isUpdating = true;
  
    try {
      const aASSET = await readASSETFile();
  
      if (aASSET === null) {
        console.error("Invalid state: aASSET is null.");
        return;
      }
  
      const currentVactTaa = vact.cVactTaa || 0;
  
      if (aASSET - currentVactTaa < 0.00001) {
        return;
      }
  
      if (aASSET > currentVactTaa) {
        const amountToImport = parseFloat((aASSET - currentVactTaa).toFixed(8));
        const importValue = amountToImport * assetPrice;
  
        // Update Vatoi: accumulate the import value
        const newCVatoi = vatoi.cVatoi + importValue;
        // cpVatoi should be the price at which the first import happened, or current price if first import
        const newCpVatoi = vatoi.cpVatoi === 0 ? assetPrice : vatoi.cpVatoi;
  
        // Update Vact: add tokens and recalculate value
        const newCVactTaa = vact.cVactTaa + amountToImport;
        const newCpVact = Math.max(vact.cpVact, assetPrice); // VAPA behavior
        const newCVact = newCVactTaa * newCpVact;
  
        const updatedVatoi: VatoiState = {
          cVatoi: parseFloat(newCVatoi.toFixed(2)),
          cpVatoi: newCpVatoi,
          cdVatoi: 0, // Will be recalculated
        };
  
        const updatedVact: VactState = {
          cVact: parseFloat(newCVact.toFixed(2)),
          cpVact: newCpVact,
          cVactTaa: parseFloat(newCVactTaa.toFixed(8)),
        };
  
        await updateAllState(assetPrice, updatedVatoi, updatedVact, email);
      }
    } catch (error) {
      console.error("Error during handleImport:", error);
    } finally {
      isUpdating = false;
    }
  };

  useEffect(() => {
    let isSyncing = false;
  
    const interval = setInterval(async () => {
      if (isSyncing) return;
  
      isSyncing = true;
  
      try {
        await readASSETFile();
        await handleImport(0); // Trigger import check
      } catch (error) {
        console.error("Error in interval execution:", error);
      } finally {
        isSyncing = false;
      }
    }, 3000);
  
    return () => clearInterval(interval);
  }, [vact.cVactTaa, email]);

  const handleImportASSET = async (amount: number) => {
    if (amount < 0.0001) {
      alert('The minimum import amount is 0.0001 ASSET.');
      return;
    }
    try {
      await axios.post('/api/saveASSET', { email, amount });
    } catch (error) {
      console.error('Error saving to aASSET.json:', error);
    }
  };

  const saveVatoiState = async ({
    email,
    vatoi,
    vact,
    vapa,
    exportedAmounts,
  }: {
    email: string;
    vatoi: VatoiState;
    vact: VactState;
    vapa: number;
    exportedAmounts: number;
  }) => {
    try {
      const payload = {
        email,
        vatoi,
        vact,
        vapa,
        exportedAmounts,
      };
  
      await axios.post('/api/saveVatoiState', payload);
    } catch (error) {
      console.error('Error saving vatoi state:', error);
    }
  };

  const handleExport = async (amount: number) => {
    if (isUpdating) return;
  
    isUpdating = true;
  
    try {
      const assetAmount = parseFloat((amount / assetPrice).toFixed(8));
  
      if (amount > vact.cVact) {
        alert(`Insufficient funds! You tried to export $${amount}, but only $${vact.cVact} is available.`);
        return;
      }
  
      if (assetAmount > vact.cVactTaa) {
        alert(`Insufficient tokens! You tried to export ${assetAmount} ASSET, but only ${vact.cVactTaa} ASSET is available.`);
        return;
      }
  
      const newASSET = await updateASSETFile(-assetAmount);
  
      // Calculate new token amount and values
      const newCVactTaa = vact.cVactTaa - assetAmount;
      const newCVact = newCVactTaa * vact.cpVact;
      
      // Update Vatoi: reduce cVatoi proportionally
      const exportRatio = assetAmount / vact.cVactTaa;
      const newCVatoi = vatoi.cVatoi * (1 - exportRatio);
  
      const updatedVact: VactState = {
        cVact: parseFloat(newCVact.toFixed(2)),
        cpVact: vact.cpVact, // Keep same price (VAPA)
        cVactTaa: parseFloat(newCVactTaa.toFixed(8)),
      };
  
      const updatedVatoi: VatoiState = {
        cVatoi: parseFloat(newCVatoi.toFixed(2)),
        cpVatoi: vatoi.cpVatoi, // Keep original import price
        cdVatoi: 0, // Will be recalculated
      };
  
      setVact(updatedVact);
      setVatoi(updatedVatoi);
      setExportedAmounts((prev) => prev + amount);
  
      await saveVatoiState({
        email,
        vatoi: updatedVatoi,
        vact: updatedVact,
        vapa,
        exportedAmounts: exportedAmounts + amount,
      });
    } catch (error) {
      console.error("Error during export operation:", error);
    } finally {
      isUpdating = false;
    }
  };

  const fetchVavityAggregator = async (email: string): Promise<any> => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      const response = await axios.get(`/api/fetchVavityAggregator`, { params: { email } });
      return response.data;
    } catch (error) {
      console.error('Error fetching Vavity Aggregator data:', error);
      throw error;
    }
  };

  const addVavityAggregator = async (email: string, newVatopGroups: any[]): Promise<any> => {
    try {
      if (!email || !Array.isArray(newVatopGroups) || newVatopGroups.length === 0) {
        throw new Error('Email and non-empty newVatopGroups array are required');
      }
      const response = await axios.post('/api/addVavityAggregator', {
        email,
        newVatopGroups,
      });
      return response.data;
    } catch (error) {
      console.error('Error adding Vavity Aggregator data:', error);
      throw error;
    }
  };

  const saveVavityAggregator = async (email: string, vatopGroups: any[], vatopCombinations: any): Promise<any> => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      const response = await axios.post('/api/saveVavityAggregator', {
        email,
        vatopGroups,
        vatopCombinations,
      });
      return response.data;
    } catch (error) {
      console.error('Error saving Vavity Aggregator data:', error);
      throw error;
    }
  };

  return (
    <Vavityaggregator.Provider
      value={{
        assetPrice,
        vatoi,
        vact,
        totals,
        vapa,
        importAmount,
        exportAmount,
        setImportAmount,
        setExportAmount,
        handleImport,
        handleImportASSET,
        handleExport,
        setManualAssetPrice,
        email,
        exportedAmounts,
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