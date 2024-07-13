'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EmailContextProps {
  email: string;
  setEmail: (email: string) => void;
}

const EmailContext = createContext<EmailContextProps | undefined>(undefined);

export const EmailProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string>('');
  return (
    <EmailContext.Provider value={{ email, setEmail }}>
      {children}
    </EmailContext.Provider>
  );
};

export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
};