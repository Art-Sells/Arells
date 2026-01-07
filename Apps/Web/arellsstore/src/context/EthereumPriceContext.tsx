'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchEthereumPrice } from '../lib/coingecko-api';

const EthereumPriceContext = createContext<number | undefined>(undefined);

export const EthereumPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [price, setPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const getPrice = async () => {
      try {
        const fetchedPrice = await fetchEthereumPrice();
        setPrice(fetchedPrice);
      } catch (error) {
        console.error('Error fetching Ethereum price:', error);
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
    <EthereumPriceContext.Provider value={price}>
      {children}
    </EthereumPriceContext.Provider>
  );
};

export const useEthereumPrice = () => {
  return useContext(EthereumPriceContext);
};