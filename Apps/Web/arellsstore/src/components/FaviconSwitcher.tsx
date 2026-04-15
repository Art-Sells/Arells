'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

const DEFAULT_FAVICON = '/ArellsIcoIcon.png';
const BITCOIN_FAVICON = '/images/favicons/BtcBadge.svg';
const ETHEREUM_FAVICON = '/images/favicons/EthBadge.svg';
const VAVITY_FAVICON = '/images/vavity/favicon.png';

/**
 * Keep tab icon in sync on SPA navigations (Next head can retain the previous route’s links).
 * — `/vavity` and all nested routes use the Vavity favicon (matches `app/vavity/layout.tsx`).
 * — Asset roots use badge icons; everything else uses Arells.
 *
 * iOS Safari often ignores or mishandles SVG `apple-touch-icon` and may fall back to unrelated
 * icons (e.g. after visiting external asset links). Always use the Arells PNG for
 * `apple-touch-icon`; keep SVG/PNG badges on `icon` / `shortcut icon` only.
 */
const resolveFavicon = (pathname: string) => {
  const seg = pathname.split('/').filter(Boolean)[0];
  if (seg === 'vavity') return VAVITY_FAVICON;
  if (seg === 'bitcoin') return BITCOIN_FAVICON;
  if (seg === 'ethereum') return ETHEREUM_FAVICON;
  return DEFAULT_FAVICON;
};

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Update every matching link (Next may emit several); add one if the head has none yet. */
const syncRel = (rel: string, href: string, type?: string) => {
  const list = document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (list.length === 0) {
    const link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (type) link.type = type;
    link.href = href;
    document.head.appendChild(link);
    return;
  }
  list.forEach((el) => {
    if (type) el.type = type;
    el.href = href;
  });
};

export default function FaviconSwitcher() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const href = resolveFavicon(pathname || '/');
    const type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

    syncRel('icon', href, type);
    syncRel('shortcut icon', href, type);
    syncRel('apple-touch-icon', DEFAULT_FAVICON);
  }, [pathname]);

  return null;
}
