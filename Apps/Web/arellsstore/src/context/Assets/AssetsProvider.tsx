/* eslint-disable @next/next/no-img-element */
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type AssetState = {
  vapa: number;
  vapaDate: string | null;
  history: { date: string; price: number }[];
  vapaMarketCap: number[];
};

type AssetsContextType = {
  assets: Record<string, AssetState>;
  refreshAll: () => Promise<void>;
};

const AssetsContext = createContext<AssetsContextType | undefined>(undefined);

const initialAssetState: AssetState = { vapa: 0, vapaDate: null, history: [], vapaMarketCap: [] };

export const AssetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Record<string, AssetState>>({});

  const refreshAll = useMemo(
    () => async () => {
      try {
        const resp = await axios.get('/api/assets/crypto/vapaRefreshAll', { timeout: 15000 });
        const data = resp.data || {};
        const next: Record<string, AssetState> = {};
        for (const key of Object.keys(data)) {
          const item = data[key] || {};
          next[key] = {
            vapa: item.vapa || 0,
            vapaDate: item.vapaDate ?? null,
            history: Array.isArray(item.history) ? item.history : [],
            vapaMarketCap: Array.isArray(item.vapaMarketCap) ? item.vapaMarketCap : [],
          };
        }
        setAssets(next);
      } catch (err) {
        console.warn('[AssetsProvider] refresh failed', err);
      }
    },
    []
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const value = useMemo(
    () => ({
      assets,
      refreshAll,
    }),
    [assets, refreshAll]
  );

  return <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>;
};

export const useAsset = (assetId: string) => {
  const ctx = useContext(AssetsContext);
  if (!ctx) throw new Error('useAsset must be used within AssetsProvider');
  return ctx.assets[assetId] || initialAssetState;
};
