'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface BitcoinPriceContextType {
  bitcoinPrice: number | null;
  setBitcoinPrice: (price: number) => void;
}

const BitcoinPriceContext = createContext<BitcoinPriceContextType | undefined>(undefined);

export const BitcoinPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get('/api/bitcoinPrice');
        const price = response.data?.bitcoin?.usd;
        if (typeof price === 'number') {
          setBitcoinPrice(price);
        }
      } catch {
        // silent
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BitcoinPriceContext.Provider value={{ bitcoinPrice, setBitcoinPrice }}>
      {children}
    </BitcoinPriceContext.Provider>
  );
};

export const useBitcoinPrice = () => {
  const ctx = useContext(BitcoinPriceContext);
  if (!ctx) {
    throw new Error('useBitcoinPrice must be used within a BitcoinPriceProvider');
  }
  return ctx;
};
