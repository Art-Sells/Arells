'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import {
  clearAllNavControlLoading,
  isInternalPageNavigation,
  markNavControlLoading,
  subscribeAppNavigation,
} from '../../../lib/client/navCircleLoader';

/**
 * Puts a loading circle on the clicked nav control (link/button), not a page overlay.
 */
export default function AssetNavCircleLoaderHost() {
  const pathname = usePathname() || '';
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (anchor instanceof HTMLAnchorElement) {
        if (anchor.hasAttribute('download')) return;
        if (anchor.target && anchor.target !== '_self') return;
        const href = anchor.getAttribute('href');
        if (!isInternalPageNavigation(pathnameRef.current, href)) return;
        markNavControlLoading(anchor, href);
        return;
      }

      const button = target.closest('button, [role="button"]');
      if (!(button instanceof HTMLElement)) return;
      /* Programmatic navigations call signalAppNavigation; plain buttons ignored here. */
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    return subscribeAppNavigation(({ element }) => {
      if (element) markNavControlLoading(element);
    });
  }, []);

  useEffect(() => {
    clearAllNavControlLoading();
  }, [pathname]);

  return null;
}
