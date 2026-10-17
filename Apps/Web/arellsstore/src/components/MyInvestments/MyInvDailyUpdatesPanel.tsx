'use client';

import React from 'react';
import TBARDaily from '../Assets/Crypto/TBAR/Daily';

export default function MyInvDailyUpdatesPanel() {
  // Height-down only — no page-slide-in on mount.
  return <TBARDaily variant="myinv" mountExpand />;
}
