'use client';

import { useUser } from '../../context/UserContext';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

const ENABLED = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === '1';
const HEARTBEAT_MS = 15_000;

function postSignedInSiteActivityMount() {
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
}

export default function AnalyticsBeacon() {
  const { sessionId, sessionReady, authSessionLoading, isSignedIn, email } = useUser();
  const pathname = usePathname() || '/';
  const openedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);

  const send = useCallback(
    (type: 'open' | 'heartbeat' | 'pageview', path?: string) => {
      if (!ENABLED || !sessionId) return;
      void fetch('/api/analytics/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, type, path }),
      }).catch(() => undefined);
    },
    [sessionId]
  );

  /* Signed-in visit on any route → DAUt/WAUt/MAUt (union with session-meta when analytics is on). */
  useEffect(() => {
    if (!sessionReady || authSessionLoading || !isSignedIn || !email) return;
    postSignedInSiteActivityMount();
  }, [sessionReady, authSessionLoading, isSignedIn, email, pathname]);

  useEffect(() => {
    if (!sessionReady || !sessionId || !ENABLED) return;
    if (openedRef.current) return;
    openedRef.current = true;
    lastPathRef.current = pathname;
    send('open', pathname);
  }, [sessionReady, sessionId, pathname, send]);

  useEffect(() => {
    if (!sessionReady || !sessionId || !ENABLED) return;
    if (!openedRef.current) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    send('pageview', pathname);
  }, [pathname, sessionReady, sessionId, send]);

  useEffect(() => {
    if (!sessionReady || !sessionId || !ENABLED) return;
    const t = window.setInterval(() => send('heartbeat', lastPathRef.current || pathname), HEARTBEAT_MS);
    return () => window.clearInterval(t);
  }, [sessionReady, sessionId, pathname, send]);

  useEffect(() => {
    if (!ENABLED || !sessionId) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        void fetch('/api/analytics/beacon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({
            sessionId,
            type: 'heartbeat',
            path: lastPathRef.current || pathname,
          }),
        }).catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [sessionId, pathname]);

  return null;
}
