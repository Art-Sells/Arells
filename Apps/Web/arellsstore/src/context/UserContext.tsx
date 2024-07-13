// context/UserContext.tsx
'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  email: string;
  bitcoinAddress: string;
  bitcoinPrivateKey: string;
  setEmail: (email: string) => void;
  setBitcoinAddress: (address: string) => void;
  setBitcoinPrivateKey: (key: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('');
  const [bitcoinPrivateKey, setBitcoinPrivateKey] = useState<string>('');

  return (
    <UserContext.Provider value={{ email, bitcoinAddress, bitcoinPrivateKey, setEmail, setBitcoinAddress, setBitcoinPrivateKey }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};