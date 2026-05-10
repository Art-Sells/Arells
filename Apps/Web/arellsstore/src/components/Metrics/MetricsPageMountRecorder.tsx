'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';

/**
 * Registers signed-in visits to /metrics in S3 (see /api/metrics/page-mount). DAUt/WAUt/MAUt dedupe by email only.
 */
export default function MetricsPageMountRecorder() {
  const { sessionReady, authSessionLoading, isSignedIn, email } = useUser();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!sessionReady || authSessionLoading) return;
    if (!isSignedIn || !email) return;
    if (sentRef.current) return;
    sentRef.current = true;
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
