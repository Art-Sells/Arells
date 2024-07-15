'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  email: string;
  setEmail: (email: string) => void;
  bitcoinAddress: string;
  setBitcoinAddress: (address: string) => void;
  bitcoinPrivateKey: string;
  setBitcoinPrivateKey: (key: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');

  return (
    <UserContext.Provider value={{ email, setEmail, bitcoinAddress, setBitcoinAddress, bitcoinPrivateKey, setBitcoinPrivateKey }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};