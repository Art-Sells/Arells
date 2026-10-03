'use client';

import { useEffect } from 'react';

const LEGACY_PARAMS = ['fullscreenPreview'];

export default function StripLegacyParamsRoot() {
  useEffect(() => {
    try {
      for (const key of LEGACY_PARAMS) window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of LEGACY_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);
  return null;
}
