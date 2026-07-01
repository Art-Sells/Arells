'use client';

import { useCallback } from 'react';
import type { MyInvEngagementEventType } from '../lib/portfolio/myInvestmentsEngagement';

export function useMyInvEngagementEvent() {
  const record = useCallback((event: MyInvEngagementEventType) => {
    void fetch('/api/engagement/my-investments-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ event }),
    }).catch(() => undefined);
  }, []);

  return { recordEngagement: record };
}
