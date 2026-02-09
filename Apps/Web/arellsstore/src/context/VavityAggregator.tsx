'use client';

import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

type AssetSnapshot = {
  price: number;
  vapa: number;
  vapaDate: string | null;
  history: { date: string; price: number }[];
  vapaMarketCap: number[];
  historyLastUpdated: number | null;
};

interface VavityaggregatorType {
  assets: Record<string, AssetSnapshot>;
  getAsset: (assetId: string) => AssetSnapshot | undefined;
  refreshAsset: (assetId: string) => Promise<void>;
  refreshAllAssets: () => Promise<void>;
  investments: Investment[];
  totals: TotalsState;
  sessionId: string;
  fetchVavityAggregator: (sessionId: string, asset?: string) => Promise<any>;
  addVavityAggregator: (sessionId: string, newInvestments: any[], asset?: string) => Promise<any>;
  saveVavityAggregator: (sessionId: string, investments: any[], asset?: string) => Promise<any>;
}

const Vavityaggregator = createContext<VavityaggregatorType | undefined>(undefined);

export const VavityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionId } = useUser();
  const [assets, setAssets] = useState<Record<string, AssetSnapshot>>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totals, setTotals] = useState<TotalsState>({
    acVatop: 0,
    acdVatop: 0,
    acVact: 0,
    acVactTaa: 0,
  });
  const assetIds = useMemo(() => ['bitcoin', 'ethereum'], []);

  const refreshAsset = useCallback(async (assetId: string) => {
    try {
      const response = await axios.get(`/api/assets/crypto/${assetId}/${assetId}vapa`);
      const data = response.data || {};
      const snapshot: AssetSnapshot = {
        price: typeof data.price === 'number' ? data.price : 0,
        vapa: typeof data.vapa === 'number' ? data.vapa : 0,
        vapaDate: data.vapaDate ?? null,
        history: Array.isArray(data.history) ? data.history : [],
        vapaMarketCap: Array.isArray(data.vapaMarketCap) ? data.vapaMarketCap : [],
        historyLastUpdated: typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null,
      };
      setAssets((prev) => ({ ...prev, [assetId]: snapshot }));
    } catch {
      // keep previous snapshot
    }
  }, []);

  const refreshAllAssets = useCallback(async () => {
    await Promise.all(assetIds.map((assetId) => refreshAsset(assetId)));
  }, [assetIds, refreshAsset]);

  useEffect(() => {
    refreshAllAssets();
    const interval = setInterval(refreshAllAssets, 60000);
    return () => clearInterval(interval);
  }, [refreshAllAssets]);

  const getAsset = useCallback((assetId: string) => assets[assetId], [assets]);

  const fetchVavityAggregator = useCallback(async (currentSessionId: string, asset = 'bitcoin'): Promise<any> => {
    if (!currentSessionId) throw new Error('Session ID is required');
    const response = await axios.get(`/api/fetchVavityAggregator`, { params: { sessionId: currentSessionId, asset } });
    const data = response.data || {};
    const fetchedInvestments: Investment[] = Array.isArray(data.investments) ? data.investments : [];
    const fetchedTotals: TotalsState = data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
    setInvestments(fetchedInvestments);
    setTotals(fetchedTotals);
    return data;
  }, []);

  const addVavityAggregator = useCallback(async (currentSessionId: string, newInvestments: any[], asset = 'bitcoin'): Promise<any> => {
    if (!currentSessionId || !Array.isArray(newInvestments) || newInvestments.length === 0) {
      throw new Error('Session ID and non-empty newInvestments array are required');
    }
    const response = await axios.post('/api/addVavityAggregator', {
      sessionId: currentSessionId,
      newInvestments,
      asset,
    });
    const data = response.data?.data || {};
    setInvestments(data.investments || []);
    setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
    return response.data;
  }, []);

  const saveVavityAggregator = useCallback(async (currentSessionId: string, updatedInvestments: any[], asset = 'bitcoin'): Promise<any> => {
    if (!currentSessionId) {
      throw new Error('Session ID is required');
    }
    const response = await axios.post('/api/saveVavityAggregator', {
      sessionId: currentSessionId,
      investments: updatedInvestments,
      asset,
    });
    const data = response.data?.data || {};
    setInvestments(data.investments || updatedInvestments || []);
    setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
    return response.data;
  }, []);

  return (
    <Vavityaggregator.Provider
      value={{
        investments,
        totals,
        assets,
        getAsset,
        refreshAsset,
        refreshAllAssets,
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