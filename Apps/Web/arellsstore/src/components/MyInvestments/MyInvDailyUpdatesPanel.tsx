'use client';

import React from 'react';
import TBARDaily from '../Assets/Crypto/TBAR/Daily';

type DailyUpdatesPanelProps = {
  slideIn: boolean;
};

export default function MyInvDailyUpdatesPanel({ slideIn }: DailyUpdatesPanelProps) {
  return (
    <div className={slideIn ? 'page-slide-in' : undefined}>
      <TBARDaily variant="myinv" mountExpand={slideIn} />
    </div>
  );
}
