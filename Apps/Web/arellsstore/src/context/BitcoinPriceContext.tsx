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
        setPrice(undefined); // Reset to undefined on error
      }
    };

    getPrice(); // Initial fetch

    const interval = setInterval(() => {
      getPrice(); // Fetch price every 3 seconds
    }, 3000);

    return () => clearInterval(interval); // Clear interval on unmount
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