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
      } catch (error) {
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