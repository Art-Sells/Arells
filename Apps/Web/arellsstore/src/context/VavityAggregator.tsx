'use client';

import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';

interface Investment {
  cVatop: number;   // Value at time of purchase
  cpVatop: number;  // VAPA at purchase
  cVact: number;    // Current value (cVactTaa * cpVact)
  cpVact: number;   // Current price (tracks VAPA)
  cVactTaa: number; // Token amount
  cdVatop: number;  // cVact - cVatop
  date?: string;    // Optional date purchased
  asset?: string;   // Asset identifier (e.g., bitcoin)
}

interface TotalsState {
  acVatop: number;
  acdVatop: number;
  acVact: number;
  acVactTaa: number;
}

interface VavityaggregatorType {
  assetPrice: number;
  vapa: number;
  vapaDate: string | null;
  investments: Investment[];
  totals: TotalsState;
  vavityPrice: number; // Alias for vapa (legacy compatibility)
  setManualAssetPrice: (price: number | ((currentPrice: number) => number)) => void;
  sessionId: string;
  fetchVavityAggregator: (sessionId: string) => Promise<any>;
  addVavityAggregator: (sessionId: string, newInvestments: any[]) => Promise<any>;
  saveVavityAggregator: (sessionId: string, investments: any[]) => Promise<any>;
}

const Vavityaggregator = createContext<VavityaggregatorType | undefined>(undefined);

export const VavityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionId } = useUser();
  const [assetPrice, setAssetPrice] = useState<number>(0);
  const [vapa, setVapa] = useState<number>(0);
  const [vapaDate, setVapaDate] = useState<string | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totals, setTotals] = useState<TotalsState>({
    acVatop: 0,
    acdVatop: 0,
    acVact: 0,
    acVactTaa: 0,
  });
  
  // Fetch Bitcoin price on mount and periodically
  // assetPrice = current Bitcoin price
  // VAPA = highest Bitcoin price ever from historical data
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch current Bitcoin price
        const currentPriceResponse = await axios.get('/api/bitcoinPrice');
        const currentPrice = currentPriceResponse.data?.['bitcoin']?.usd;
        if (currentPrice) {
          setAssetPrice(currentPrice);
        }

        // Fetch VAPA from global /api/vapa endpoint (persistent, never decreases)
        // VAPA is now global and doesn't depend on user email
        // This is the SINGLE SOURCE OF TRUTH for VAPA - always use it directly
        try {
          const vapaResponse = await axios.get('/api/vapa');
          const persistentVapa = vapaResponse.data?.vapa;
          const persistentVapaDate = vapaResponse.data?.vapaDate ?? null;
          if (persistentVapa !== undefined && persistentVapa !== null) {
            // Always use the global VAPA value directly (don't use Math.max with prev)
            // The global VAPA is already the highest value, so we should trust it
            setVapa(persistentVapa);
            setVapaDate(persistentVapaDate);
          }
        } catch (error) {
          // Fallback to highest price ever if VAPA API doesn't exist yet
          try {
            const highestPriceResponse = await axios.get('/api/fetchHighestBitcoinPrice');
        const highestPriceEver = highestPriceResponse.data?.highestPriceEver;
        if (highestPriceEver) {
              setVapa(highestPriceEver);
              setVapaDate(highestPriceResponse.data?.highestPriceDate ?? null);
            }
          } catch (fallbackError) {
            // If both fail, keep current VAPA or use assetPrice as last resort
            console.warn('[VavityAggregator] Could not fetch VAPA from any source');
          }
        }
      } catch (error) {
        // console.error('Error fetching Bitcoin prices:', error);
        // Keep default price on error
      }
    };

    fetchPrices(); // Initial fetch
    const interval = setInterval(fetchPrices, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []); // VAPA is now global, no email dependency
  

  const setManualAssetPrice = async (
    price: number | ((currentPrice: number) => number)
  ) => {
    const newPrice = typeof price === "function" ? price(assetPrice) : price;
    setAssetPrice(newPrice);
    setVapa((prev) => {
      const next = Math.max(prev, newPrice);
      if (next !== prev) {
        setVapaDate(new Date().toISOString());
      }
      return next;
    });
  };

  const fetchVavityAggregator = useCallback(async (currentSessionId: string): Promise<any> => {
    if (!currentSessionId) throw new Error('Session ID is required');
    const response = await axios.get(`/api/fetchVavityAggregator`, { params: { sessionId: currentSessionId } });
    const data = response.data || {};
    const fetchedInvestments: Investment[] = Array.isArray(data.investments) ? data.investments : [];
    const fetchedTotals: TotalsState = data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
    setInvestments(fetchedInvestments);
    setTotals(fetchedTotals);
    return data;
  }, []);

  const addVavityAggregator = useCallback(async (currentSessionId: string, newInvestments: any[]): Promise<any> => {
    if (!currentSessionId || !Array.isArray(newInvestments) || newInvestments.length === 0) {
      throw new Error('Session ID and non-empty newInvestments array are required');
    }
    const response = await axios.post('/api/addVavityAggregator', {
      sessionId: currentSessionId,
      newInvestments,
    });
    const data = response.data?.data || {};
    setInvestments(data.investments || []);
    setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
    return response.data;
  }, []);

  const saveVavityAggregator = useCallback(async (currentSessionId: string, updatedInvestments: any[]): Promise<any> => {
    if (!currentSessionId) {
      throw new Error('Session ID is required');
    }
    const response = await axios.post('/api/saveVavityAggregator', {
      sessionId: currentSessionId,
      investments: updatedInvestments,
    });
    const data = response.data?.data || {};
    setInvestments(data.investments || updatedInvestments || []);
    setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
    return response.data;
  }, []);

  return (
    <Vavityaggregator.Provider
      value={{
        assetPrice,
        investments,
        totals,
        vapa,
        vapaDate,
        vavityPrice: vapa,
        setManualAssetPrice,
        sessionId,
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