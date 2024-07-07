// context/BitcoinPriceContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchBitcoinPrice } from '../lib/coingecko-api';

const BitcoinPriceContext = createContext<number | undefined>(undefined);

export const BitcoinPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [price, setPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const getPrice = async () => {
      try {
        const fetchedPrice = await fetchBitcoinPrice();
        setPrice(fetchedPrice);
      } catch (error) {
        console.error('Error fetching Bitcoin price:', error);
      }
    };
    getPrice();
  }, []);

  return (
    <BitcoinPriceContext.Provider value={price}>
      {children}
    </BitcoinPriceContext.Provider>
  );
};

export const useBitcoinPrice = () => {
  return useContext(BitcoinPriceContext);
};