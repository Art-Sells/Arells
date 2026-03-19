'use client';

import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  solidHistory: { date: string; price: number }[];
  liquidHistory: { date: string; price: number }[];
  solidMarketCap: number[];
  liquidMarketCap: number[];
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
  const { sessionId, email, isSignedIn } = useUser();
  const [assets, setAssets] = useState<Record<string, AssetSnapshot>>({});
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totals, setTotals] = useState<TotalsState>({
    acVatop: 0,
    acdVatop: 0,
    acVact: 0,
    acVactTaa: 0,
  });
  const assetIds = useMemo(() => ['bitcoin', 'ethereum'], []);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const sessionExpiryTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const lastSessionAssetRef = useRef<string>('bitcoin');

  const refreshAsset = useCallback(async (assetId: string) => {
    try {
      const response = await axios.get(`/api/assets/crypto/${assetId}/${assetId}vapa`);
      const data = response.data || {};
      const snapshot: AssetSnapshot = {
        price: typeof data.price === 'number' ? data.price : 0,
        vapa: typeof data.vapa === 'number' ? data.vapa : 0,
        vapaDate: data.vapaDate ?? null,
        // Prefer Liquid/Solid keys; fall back to legacy keys.
        solidHistory: Array.isArray(data.solidHistory) ? data.solidHistory : (Array.isArray(data.history) ? data.history : []),
        liquidHistory: Array.isArray(data.liquidHistory) ? data.liquidHistory : (Array.isArray(data.realHistory) ? data.realHistory : []),
        solidMarketCap: Array.isArray(data.solidMarketCap) ? data.solidMarketCap : (Array.isArray(data.vapaMarketCap) ? data.vapaMarketCap : []),
        liquidMarketCap: Array.isArray(data.liquidMarketCap) ? data.liquidMarketCap : (Array.isArray(data.realMarketCap) ? data.realMarketCap : []),
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

  // While the user is active, auto-trigger a fetch right when the session TTL expires so the session investments clear at ~60s.
  useEffect(() => {
    if (!sessionId) return;
    if (sessionExpiresAt == null) return;
    if (investments.length === 0) {
      if (sessionExpiryTimerRef.current) {
        globalThis.clearTimeout(sessionExpiryTimerRef.current);
        sessionExpiryTimerRef.current = null;
      }
      return;
    }
    if (sessionExpiryTimerRef.current) {
      globalThis.clearTimeout(sessionExpiryTimerRef.current);
      sessionExpiryTimerRef.current = null;
    }
    const delay = sessionExpiresAt - Date.now();
    const safeDelay = Math.max(delay, 0) + 25; // small buffer
    sessionExpiryTimerRef.current = globalThis.setTimeout(async () => {
      try {
        if (typeof window !== 'undefined' && !email && !isSignedIn) {
          window.dispatchEvent(
            new CustomEvent('vavity:session-expired', {
              detail: { holdMs: 5000, expiresAt: sessionExpiresAt },
            })
          );
        }
        const response = await axios.get(`/api/fetchVavityAggregator`, {
          params: { sessionId, asset: lastSessionAssetRef.current || 'bitcoin' },
        });
        const data = response.data || {};
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
        setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
        const nextExpiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
        setSessionExpiresAt(nextExpiresAt);
      } catch {
        // ignore
      }
    }, safeDelay);
    return () => {
      if (sessionExpiryTimerRef.current) {
        globalThis.clearTimeout(sessionExpiryTimerRef.current);
        sessionExpiryTimerRef.current = null;
      }
    };
  }, [sessionExpiresAt, sessionId, email, isSignedIn, investments.length]);

  const fetchVavityAggregator = useCallback(async (currentSessionId: string, asset = 'bitcoin'): Promise<any> => {
    if (!currentSessionId) throw new Error('Session ID is required');
    const response = await axios.get(`/api/fetchVavityAggregator`, { params: { sessionId: currentSessionId, asset } });
    const data = response.data || {};
    const fetchedInvestments: Investment[] = Array.isArray(data.investments) ? data.investments : [];
    const fetchedTotals: TotalsState = data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
    setInvestments(fetchedInvestments);
    setTotals(fetchedTotals);
    lastSessionAssetRef.current = asset;
    const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
    setSessionExpiresAt(expiresAt);
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
    lastSessionAssetRef.current = asset;
    const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
    setSessionExpiresAt(expiresAt);
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
    lastSessionAssetRef.current = asset;
    const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
    setSessionExpiresAt(expiresAt);
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