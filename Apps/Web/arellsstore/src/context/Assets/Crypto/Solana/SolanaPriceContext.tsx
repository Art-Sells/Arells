'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface SolanaPriceContextType {
  solanaPrice: number | null;
  setSolanaPrice: (price: number) => void;
}

const SolanaPriceContext = createContext<SolanaPriceContextType | undefined>(undefined);

export const SolanaPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [solanaPrice, setSolanaPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get('/api/assets/crypto/solana/solanaPrice');
        const price = response.data?.solana?.usd;
        if (typeof price === 'number') {
          setSolanaPrice(price);
        }
      } catch {
        /* silent */
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SolanaPriceContext.Provider value={{ solanaPrice, setSolanaPrice }}>
      {children}
    </SolanaPriceContext.Provider>
  );
};

export const useSolanaPrice = () => {
  const ctx = useContext(SolanaPriceContext);
  if (!ctx) {
    throw new Error('useSolanaPrice must be used within a SolanaPriceProvider');
  }
  return ctx;
};
