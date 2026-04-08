'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';

/**
 * Registers each visit to /metrics in S3 (see /api/metrics/page-mount) so DAUt/WAUt/MAUt work without
 * NEXT_PUBLIC_ANALYTICS_ENABLED or session-meta path history.
 */
export default function MetricsPageMountRecorder() {
  const { sessionId, sessionReady } = useUser();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!sessionReady || !sessionId) return;
    if (sentRef.current) return;
    sentRef.current = true;
    void fetch('/api/metrics/page-mount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => {
        if (res.ok && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('arells-metrics-page-mount'));
        }
      })
      .catch(() => undefined);
  }, [sessionReady, sessionId]);

  return null;
}
