'use client';

import axios from 'axios';
import { logClientApiError } from '../lib/client/logClientApiError';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useUser } from './UserContext';
import { getAssetVapaUrl } from '../lib/assets/assetKind';
import { getHomeInitialAssetIds } from '../lib/assets/cryptoAssetRegistry';
import { SUPPORTED_STOCK_ASSET_IDS } from '../lib/assets/stockAssetRegistry';

interface Investment {
  cVatop: number;
  cpVatop: number;
  cVact: number;
  cpVact: number;
  cVactTaa: number;
  cdVatop: number;
  date?: string;
  asset?: string;
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
  loadMoreAssets: (assetIds: string[]) => Promise<void>;
  ensureAssetsLoaded: (assetIds: string[]) => Promise<void>;
  investments: Investment[];
  totals: TotalsState;
  totalsLiquid: TotalsState;
  sessionId: string;
  /** No-op stubs: anonymous session portfolio APIs removed; signed-in flows use UserContext email APIs. */
  fetchVavityAggregator: (sessionId: string, asset?: string) => Promise<any>;
  fetchVavityAggregatorAll: (sessionId: string) => Promise<any>;
  addVavityAggregator: (sessionId: string, newInvestments: any[], asset?: string) => Promise<any>;
  saveVavityAggregator: (sessionId: string, investments: any[], asset?: string) => Promise<any>;
}

const Vavityaggregator = createContext<VavityaggregatorType | undefined>(undefined);

const emptySessionTotals = { acVatop: 0, acdVatop: 0, acVact: 0, acVactTaa: 0 };

const emptySessionPayload = () => ({
  investments: [] as Investment[],
  totals: { ...emptySessionTotals },
  totalsLiquid: { ...emptySessionTotals },
  createdAt: Date.now(),
  expiresAt: Date.now() + 60_000,
});

export const VavityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionId } = useUser();
  const [assets, setAssets] = useState<Record<string, AssetSnapshot>>({});
  const [investments] = useState<Investment[]>([]);
  const [totals] = useState<TotalsState>({ ...emptySessionTotals });
  const [totalsLiquid] = useState<TotalsState>({ ...emptySessionTotals });
  /** Prefetch home crypto batch + all stocks so category panels open already market-cap sorted. */
  const initialLoadedIds = useMemo(
    () => [...getHomeInitialAssetIds(), ...SUPPORTED_STOCK_ASSET_IDS],
    []
  );
  const loadedIdsRef = useRef<Set<string>>(new Set(initialLoadedIds));

  const refreshAsset = useCallback(async (assetId: string) => {
    try {
      const response = await axios.get(getAssetVapaUrl(assetId));
      const data = response.data || {};
      const snapshot: AssetSnapshot = {
        price: typeof data.price === 'number' ? data.price : 0,
        vapa: typeof data.vapa === 'number' ? data.vapa : 0,
        vapaDate: data.vapaDate ?? null,
        solidHistory: Array.isArray(data.solidHistory)
          ? data.solidHistory
          : Array.isArray(data.history)
            ? data.history
            : [],
        liquidHistory: Array.isArray(data.liquidHistory)
          ? data.liquidHistory
          : Array.isArray(data.realHistory)
            ? data.realHistory
            : [],
        solidMarketCap: Array.isArray(data.solidMarketCap)
          ? data.solidMarketCap
          : Array.isArray(data.vapaMarketCap)
            ? data.vapaMarketCap
            : [],
        liquidMarketCap: Array.isArray(data.liquidMarketCap)
          ? data.liquidMarketCap
          : Array.isArray(data.realMarketCap)
            ? data.realMarketCap
            : [],
        historyLastUpdated: typeof data.historyLastUpdated === 'number' ? data.historyLastUpdated : null,
      };
      setAssets((prev) => ({ ...prev, [assetId]: snapshot }));
    } catch (err) {
      logClientApiError(`VavityProvider refreshAsset(${assetId})`, err);
    }
  }, []);

  const refreshAssets = useCallback(
    async (assetIds: string[]) => {
      const unique = [...new Set(assetIds.map((id) => id.toLowerCase()))];
      if (!unique.length) return;
      await Promise.all(unique.map((assetId) => refreshAsset(assetId)));
    },
    [refreshAsset]
  );

  const ensureAssetsLoaded = useCallback(
    async (assetIds: string[]) => {
      const missing = [...new Set(assetIds.map((id) => id.toLowerCase()))].filter(
        (id) => !loadedIdsRef.current.has(id)
      );
      if (!missing.length) return;
      missing.forEach((id) => loadedIdsRef.current.add(id));
      await refreshAssets(missing);
    },
    [refreshAssets]
  );

  const loadMoreAssets = useCallback(
    async (assetIds: string[]) => {
      await ensureAssetsLoaded(assetIds);
    },
    [ensureAssetsLoaded]
  );

  const refreshAllAssets = useCallback(async () => {
    await refreshAssets([...loadedIdsRef.current]);
  }, [refreshAssets]);

  useEffect(() => {
    void refreshAssets(initialLoadedIds);
    const interval = setInterval(() => {
      void refreshAssets([...loadedIdsRef.current]);
    }, 60000);
    return () => clearInterval(interval);
  }, [initialLoadedIds, refreshAssets]);

  const getAsset = useCallback((assetId: string) => assets[assetId], [assets]);

  const fetchVavityAggregator = useCallback(async (_currentSessionId: string, asset = 'bitcoin'): Promise<any> => {
    void ensureAssetsLoaded([asset]);
    return emptySessionPayload();
  }, [ensureAssetsLoaded]);

  const fetchVavityAggregatorAll = useCallback(async (_currentSessionId: string): Promise<any> => {
    return emptySessionPayload();
  }, []);

  const addVavityAggregator = useCallback(
    async (_currentSessionId: string, _newInvestments: any[], asset = 'bitcoin'): Promise<any> => {
      void ensureAssetsLoaded([asset]);
      return { data: emptySessionPayload() };
    },
    [ensureAssetsLoaded]
  );

  const saveVavityAggregator = useCallback(
    async (_currentSessionId: string, _updatedInvestments: any[], asset = 'bitcoin'): Promise<any> => {
      void ensureAssetsLoaded([asset]);
      return { data: emptySessionPayload() };
    },
    [ensureAssetsLoaded]
  );

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
        loadMoreAssets,
        ensureAssetsLoaded,
        sessionId,
        fetchVavityAggregator,
        fetchVavityAggregatorAll,
        addVavityAggregator,
        saveVavityAggregator,
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
