'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface EthereumPriceContextType {
  ethereumPrice: number | null;
  setEthereumPrice: (price: number) => void;
}

const EthereumPriceContext = createContext<EthereumPriceContextType | undefined>(undefined);

export const EthereumPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ethereumPrice, setEthereumPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get('/api/ethereumPrice');
        const price = response.data?.ethereum?.usd;
        if (typeof price === 'number') {
          setEthereumPrice(price);
        }
      } catch (error) {
        // silent failure
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <EthereumPriceContext.Provider value={{ ethereumPrice, setEthereumPrice }}>
      {children}
    </EthereumPriceContext.Provider>
  );
};

export const useEthereumPrice = () => {
  const ctx = useContext(EthereumPriceContext);
  if (!ctx) {
    throw new Error('useEthereumPrice must be used within an EthereumPriceProvider');
  }
  return ctx;
};
