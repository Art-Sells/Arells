'use client';

import React from 'react';
import AlienRaceDailyUpdates from '../AlienRaceDailyUpdates';

type DailyUpdatesPanelProps = {
  slideIn: boolean;
};

export default function MyInvDailyUpdatesPanel({ slideIn }: DailyUpdatesPanelProps) {
  return (
    <div className={slideIn ? 'page-slide-in' : undefined}>
      <AlienRaceDailyUpdates variant="myinv" mountExpand={slideIn} />
    </div>
  );
}
