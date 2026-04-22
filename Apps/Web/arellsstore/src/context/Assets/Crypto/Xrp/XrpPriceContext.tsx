'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface XrpPriceContextType {
  xrpPrice: number | null;
  setXrpPrice: (price: number) => void;
}

const XrpPriceContext = createContext<XrpPriceContextType | undefined>(undefined);

export const XrpPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xrpPrice, setXrpPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get('/api/assets/crypto/xrp/xrpPrice');
        const price = response.data?.ripple?.usd;
        if (typeof price === 'number') {
          setXrpPrice(price);
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
    <XrpPriceContext.Provider value={{ xrpPrice, setXrpPrice }}>
      {children}
    </XrpPriceContext.Provider>
  );
};

export const useXrpPrice = () => {
  const ctx = useContext(XrpPriceContext);
  if (!ctx) {
    throw new Error('useXrpPrice must be used within an XrpPriceProvider');
  }
  return ctx;
};
