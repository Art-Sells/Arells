'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface UserContextType {
  sessionId: string;
  setSessionId: (value: string) => void;
  resetSessionId: () => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const SESSION_KEY = 'arells_session_id';

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionIdState] = useState<string>('');

  const setSessionId = useCallback((value: string) => {
    setSessionIdState(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem(SESSION_KEY, value);
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const resetSessionId = useCallback(() => {
    const next = generateSessionId();
    setSessionId(next);
    return next;
  }, [setSessionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionIdState(stored);
        } else {
      const next = generateSessionId();
      setSessionId(next);
        }
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) {
        setSessionIdState(event.newValue ?? '');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setSessionId]);

  return (
    <UserContext.Provider
      value={{
        sessionId,
        setSessionId,
        resetSessionId,
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