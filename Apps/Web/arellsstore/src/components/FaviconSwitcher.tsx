'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DEFAULT_FAVICON = '/ArellsIcoIcon.png';
const BITCOIN_FAVICON = '/images/favicons/BtcBadge.svg';
const ETHEREUM_FAVICON = '/images/favicons/EthBadge.svg';

const resolveFavicon = (pathname: string) => {
  if (pathname.startsWith('/bitcoin')) return BITCOIN_FAVICON;
  if (pathname.startsWith('/ethereum')) return ETHEREUM_FAVICON;
  return DEFAULT_FAVICON;
};

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

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const href = resolveFavicon(pathname || '/');
    const type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

    syncRel('icon', href, type);
    syncRel('shortcut icon', href, type);
    syncRel('apple-touch-icon', href);
  }, [pathname]);

  return null;
}
