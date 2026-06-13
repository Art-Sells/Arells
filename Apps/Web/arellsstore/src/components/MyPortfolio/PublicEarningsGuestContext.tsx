'use client';

import React, { createContext, useContext } from 'react';
import type { PublicEarningsPayload } from '../../lib/portfolio/referralShares';

const PublicEarningsGuestContext = createContext<PublicEarningsPayload | null>(null);

export function PublicEarningsGuestProvider({
  value,
  children,
}: {
  value: PublicEarningsPayload | null;
  children: React.ReactNode;
}) {
  return (
    <PublicEarningsGuestContext.Provider value={value}>{children}</PublicEarningsGuestContext.Provider>
  );
}

export function useInitialPublicEarnings() {
  return useContext(PublicEarningsGuestContext);
}
