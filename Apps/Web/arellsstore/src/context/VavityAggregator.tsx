'use client';

import axios from 'axios';
import { logClientApiError } from '../lib/client/logClientApiError';
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

const PREVIEW_SKIP_SESSION_DELETES = false;

interface VavityaggregatorType {
  assets: Record<string, AssetSnapshot>;
  getAsset: (assetId: string) => AssetSnapshot | undefined;
  refreshAsset: (assetId: string) => Promise<void>;
  refreshAllAssets: () => Promise<void>;
  investments: Investment[];
  totals: TotalsState;
  totalsLiquid: TotalsState;
  sessionId: string;
  fetchVavityAggregator: (sessionId: string, asset?: string) => Promise<any>;
  fetchVavityAggregatorAll: (sessionId: string) => Promise<any>;
  addVavityAggregator: (sessionId: string, newInvestments: any[], asset?: string) => Promise<any>;
  saveVavityAggregator: (sessionId: string, investments: any[], asset?: string) => Promise<any>;
}

const Vavityaggregator = createContext<VavityaggregatorType | undefined>(undefined);

const emptySessionTotals = { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };

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
  const [totalsLiquid, setTotalsLiquid] = useState<TotalsState>({
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
    } catch (err) {
      logClientApiError(`VavityProvider refreshAsset(${assetId})`, err);
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

  useEffect(() => {
    if (!email) return;
    setInvestments([]);
    setTotals({ ...emptySessionTotals });
    setTotalsLiquid({ ...emptySessionTotals });
    setSessionExpiresAt(null);
  }, [email]);

  // While the user is active, auto-trigger a fetch right when the session TTL expires so the session investments clear at ~60s.
  useEffect(() => {
    if (email) {
      if (sessionExpiryTimerRef.current) {
        globalThis.clearTimeout(sessionExpiryTimerRef.current);
        sessionExpiryTimerRef.current = null;
      }
      return;
    }
    if (PREVIEW_SKIP_SESSION_DELETES) {
      if (sessionExpiryTimerRef.current) {
        globalThis.clearTimeout(sessionExpiryTimerRef.current);
        sessionExpiryTimerRef.current = null;
      }
      return;
    }
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
        if (email) return;
        if (typeof window !== 'undefined' && !email && !isSignedIn) {
          window.dispatchEvent(
            new CustomEvent('vavity:session-expired', {
              detail: { holdMs: 5000, expiresAt: sessionExpiresAt },
            })
          );
          await new Promise((r) => globalThis.setTimeout(r, 1100));
        }
        const response = await axios.get(`/api/fetchVavityAggregator`, {
          params: {
            sessionId,
            asset: lastSessionAssetRef.current || 'bitcoin',
            ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: '1' } : {}),
          },
        });
        const data = response.data || {};
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
        setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
        setTotalsLiquid(data.totalsLiquid || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
        const nextExpiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
        setSessionExpiresAt(nextExpiresAt);
      } catch (err) {
        logClientApiError('VavityProvider session-expiry refetch', err);
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
    if (email) {
      return {
        investments: [],
        totals: { ...emptySessionTotals },
        totalsLiquid: { ...emptySessionTotals },
      };
    }
    if (!currentSessionId) throw new Error('Session ID is required');
    try {
      const response = await axios.get(`/api/fetchVavityAggregator`, {
        params: {
          sessionId: currentSessionId,
          asset,
          ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: '1' } : {}),
        },
      });
      const data = response.data || {};
      const hasCreatedAt = typeof data.createdAt === 'number' && Number.isFinite(data.createdAt);
      const hasExpiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt);
      if (!hasCreatedAt || !hasExpiresAt) {
        try {
          await saveVavityAggregator(currentSessionId, [], asset);
          const refreshed = await axios.get(`/api/fetchVavityAggregator`, {
            params: {
              sessionId: currentSessionId,
              asset,
              ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: '1' } : {}),
            },
          });
          Object.assign(data, refreshed.data || {});
        } catch (err) {
          logClientApiError(`fetchVavityAggregator session-init:${asset}`, err);
        }
      }
      const fetchedInvestments: Investment[] = Array.isArray(data.investments) ? data.investments : [];
      const fetchedTotals: TotalsState = data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
      const fetchedTotalsLiquid: TotalsState = data.totalsLiquid || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
      setInvestments(fetchedInvestments);
      setTotals(fetchedTotals);
      setTotalsLiquid(fetchedTotalsLiquid);
      lastSessionAssetRef.current = asset;
      const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
      setSessionExpiresAt(expiresAt);
      return data;
    } catch (err) {
      logClientApiError(`fetchVavityAggregator:${asset}`, err);
      throw err;
    }
  }, [email]);

  const fetchVavityAggregatorAll = useCallback(async (currentSessionId: string): Promise<any> => {
    if (email) {
      return {
        investments: [],
        totals: { ...emptySessionTotals },
        totalsLiquid: { ...emptySessionTotals },
      };
    }
    if (!currentSessionId) throw new Error('Session ID is required');
    try {
      const response = await axios.get(`/api/fetchVavityAggregator`, {
        params: {
          sessionId: currentSessionId,
          ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: '1' } : {}),
        },
      });
      const data = response.data || {};
      const fetchedInvestments: Investment[] = Array.isArray(data.investments) ? data.investments : [];
      const fetchedTotals: TotalsState = data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
      const fetchedTotalsLiquid: TotalsState = data.totalsLiquid || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };
      setInvestments(fetchedInvestments);
      setTotals(fetchedTotals);
      setTotalsLiquid(fetchedTotalsLiquid);
      const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
      setSessionExpiresAt(expiresAt);
      return data;
    } catch (err) {
      logClientApiError('fetchVavityAggregatorAll', err);
      throw err;
    }
  }, [email]);

  const addVavityAggregator = useCallback(async (currentSessionId: string, newInvestments: any[], asset = 'bitcoin'): Promise<any> => {
    if (email) {
      return { data: { investments: [], totals: { ...emptySessionTotals }, totalsLiquid: { ...emptySessionTotals } } };
    }
    if (!currentSessionId || !Array.isArray(newInvestments) || newInvestments.length === 0) {
      throw new Error('Session ID and non-empty newInvestments array are required');
    }
    try {
      const response = await axios.post('/api/addVavityAggregator', {
        sessionId: currentSessionId,
        newInvestments,
        asset,
        ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: true } : {}),
      });
      const data = response.data?.data || {};
      setInvestments(data.investments || []);
      setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
      setTotalsLiquid(data.totalsLiquid || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
      lastSessionAssetRef.current = asset;
      const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
      setSessionExpiresAt(expiresAt);
      return response.data;
    } catch (err) {
      logClientApiError(`addVavityAggregator:${asset}`, err);
      throw err;
    }
  }, [email]);

  const saveVavityAggregator = useCallback(async (currentSessionId: string, updatedInvestments: any[], asset = 'bitcoin'): Promise<any> => {
    if (email) {
      return { data: { investments: updatedInvestments || [], totals: { ...emptySessionTotals }, totalsLiquid: { ...emptySessionTotals } } };
    }
    if (!currentSessionId) {
      throw new Error('Session ID is required');
    }
    try {
      const response = await axios.post('/api/saveVavityAggregator', {
        sessionId: currentSessionId,
        investments: updatedInvestments,
        asset,
        ...(PREVIEW_SKIP_SESSION_DELETES ? { skipExpiry: true } : {}),
      });
      const data = response.data?.data || {};
      setInvestments(data.investments || updatedInvestments || []);
      setTotals(data.totals || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
      setTotalsLiquid(data.totalsLiquid || { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 });
      lastSessionAssetRef.current = asset;
      const expiresAt = typeof data.expiresAt === 'number' && Number.isFinite(data.expiresAt) ? data.expiresAt : null;
      setSessionExpiresAt(expiresAt);
      return response.data;
    } catch (err) {
      logClientApiError(`saveVavityAggregator:${asset}`, err);
      throw err;
    }
  }, [email]);

  return (
    <Vavityaggregator.Provider
      value={{
        investments,
        totals,
        totalsLiquid,
        assets,
        getAsset,
        refreshAsset,
        refreshAllAssets,
        sessionId,
        fetchVavityAggregator,
        fetchVavityAggregatorAll,
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