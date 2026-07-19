'use client';

import { useUser } from '../../context/UserContext';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

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
  const { sessionReady, authSessionLoading, isSignedIn, email } = useUser();
  const pathname = usePathname() || '/';

  /* Signed-in visit on any route → DAUt/WAUt/MAUt */
  useEffect(() => {
    if (!sessionReady || authSessionLoading || !isSignedIn || !email) return;
    postSignedInSiteActivityMount();
  }, [sessionReady, authSessionLoading, isSignedIn, email, pathname]);

  return null;
}
