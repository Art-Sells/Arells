'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface UserContextType {
  email: string;
  setEmail: (email: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const AUTH_EMAIL_KEY = 'arells_email';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState<string>('');
  const setEmailWithStorage = useCallback((value: string) => {
    setEmail(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem(AUTH_EMAIL_KEY, value);
      } else {
        window.localStorage.removeItem(AUTH_EMAIL_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(AUTH_EMAIL_KEY);
    if (stored) {
      setEmail(stored);
    }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_EMAIL_KEY) {
        setEmail(event.newValue ?? '');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <UserContext.Provider
      value={{
        email,
        setEmail: setEmailWithStorage,
      }}
    >
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