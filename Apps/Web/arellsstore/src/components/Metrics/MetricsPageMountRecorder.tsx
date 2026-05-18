'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';

/**
 * Busts the metrics activity cache when /metrics loads (DAUt/WAUt/MAUt come from site-wide `AnalyticsBeacon`, not this POST).
 */
export default function MetricsPageMountRecorder() {
  const { sessionReady, authSessionLoading, isSignedIn, email } = useUser();
  /** Last email we recorded for this page visit (reset on sign-out so account switches on /metrics each POST once). */
  const recordedEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionReady || authSessionLoading) return;
    if (!isSignedIn || !email) {
      recordedEmailRef.current = null;
      return;
    }
    if (recordedEmailRef.current === email) return;
    recordedEmailRef.current = email;
    void fetch('/api/metrics/page-mount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (res.ok && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('arells-metrics-page-mount'));
        }
      })
      .catch(() => undefined);
  }, [sessionReady, authSessionLoading, isSignedIn, email]);

  return null;
}
