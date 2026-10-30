'use client';

import { useSyncExternalStore } from 'react';

/** Mark the clicked control while an in-app navigation is in flight. */

const LOADING_CLASS = 'is-nav-loading';
const SPINNER_CLASS = 'nav-control-spinner';
const LABEL_LOADING_CLASS = 'is-nav-loading-label';

type NavSignalDetail = {
  href?: string | null;
  element?: HTMLElement | null;
};

type NavListener = (detail: NavSignalDetail) => void;

const listeners = new Set<NavListener>();
const hrefListeners = new Set<() => void>();

let pendingNavHref: string | null = null;

function emitHref() {
  hrefListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* ignore */
    }
  });
}

export function getPendingNavHref(): string | null {
  return pendingNavHref;
}

export function setPendingNavHref(href: string | null): void {
  const next = href ? normalizePath(href) : null;
  if (pendingNavHref === next) return;
  pendingNavHref = next;
  emitHref();
}

export function subscribePendingNavHref(listener: () => void): () => void {
  hrefListeners.add(listener);
  return () => {
    hrefListeners.delete(listener);
  };
}

export function usePendingNavHref(): string | null {
  return useSyncExternalStore(subscribePendingNavHref, getPendingNavHref, () => null);
}

export function isPendingNavTarget(href: string | null | undefined): boolean {
  if (!pendingNavHref || !href) return false;
  return normalizePath(href) === pendingNavHref;
}

export function signalAppNavigation(
  href?: string | null,
  element?: HTMLElement | null
): void {
  if (typeof window === 'undefined') return;
  const detail: NavSignalDetail = {
    href: href ?? null,
    element:
      element ||
      (document.activeElement instanceof HTMLElement ? document.activeElement : null),
  };
  listeners.forEach((listener) => {
    try {
      listener(detail);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeAppNavigation(listener: NavListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function normalizePath(raw: string): string {
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      raw = new URL(raw).pathname;
    }
  } catch {
    /* keep raw */
  }
  const path = (raw.split('?')[0] || '/').split('#')[0] || '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export function isInternalPageNavigation(
  currentPath: string,
  href: string | null | undefined
): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('#')
  ) {
    return false;
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      if (typeof window !== 'undefined' && url.origin !== window.location.origin) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return normalizePath(currentPath) !== normalizePath(trimmed);
}

function isAssetBadgeLink(el: HTMLElement): boolean {
  return (
    el.classList.contains('home-asset-card') ||
    el.classList.contains('myinv-asset-home-card') ||
    el.classList.contains('bitcoin-alien-race-asset-card')
  );
}

function ensureSpinner(parent: HTMLElement): void {
  if (parent.querySelector(`:scope > .${SPINNER_CLASS}`)) return;
  const spin = document.createElement('span');
  spin.className = SPINNER_CLASS;
  spin.setAttribute('aria-hidden', 'true');
  parent.appendChild(spin);
}

/**
 * View My Character / Create Character: only the bottom label spins — photo stays.
 * Spinner is CSS ::after; React also mirrors via pending href + is-nav-loading-label.
 */
function markAlienPhotoHitLoading(hit: HTMLElement): void {
  hit.setAttribute('aria-busy', 'true');
  hit.classList.remove(LOADING_CLASS);
  hit.querySelectorAll(`:scope > .${SPINNER_CLASS}`).forEach((spin) => spin.remove());
  const label = hit.querySelector('.asset-alien-photo-plus');
  if (!(label instanceof HTMLElement)) return;
  label.classList.add(LABEL_LOADING_CLASS);
}

export function markNavControlLoading(el: HTMLElement, href?: string | null): void {
  const resolvedHref = href || el.getAttribute('href');
  if (resolvedHref) setPendingNavHref(resolvedHref);

  /* Photo slot link — never blank the whole card. */
  if (el.classList.contains('asset-alien-photo-hit')) {
    markAlienPhotoHitLoading(el);
    return;
  }
  const photoHit = el.closest('.asset-alien-photo-hit');
  if (photoHit instanceof HTMLElement) {
    markAlienPhotoHitLoading(photoHit);
    return;
  }

  /* Asset badge cards — React rows read pending href; spinner via CSS ::after. */
  if (isAssetBadgeLink(el)) {
    el.setAttribute('aria-busy', 'true');
    el.classList.add(LOADING_CLASS);
    el.querySelectorAll(
      '.asset-action-button--home-asset-chip, .home-asset-name.asset-action-button'
    ).forEach((chip) => {
      if (!(chip instanceof HTMLElement)) return;
      chip.classList.add('is-nav-loading-chip');
    });
    return;
  }

  if (
    el.querySelector(
      '.asset-footer-portfolio-button-spinner, .myinv-mission-portfolio-button-spinner'
    )
  ) {
    el.classList.add(LOADING_CLASS);
    el.setAttribute('aria-busy', 'true');
    return;
  }

  if (el.classList.contains(LOADING_CLASS)) return;
  el.classList.add(LOADING_CLASS);
  el.setAttribute('aria-busy', 'true');
  if (el instanceof HTMLButtonElement) el.disabled = true;
  ensureSpinner(el);
}

export function clearAllNavControlLoading(): void {
  setPendingNavHref(null);
  if (typeof document === 'undefined') return;
  document.querySelectorAll(`.${LOADING_CLASS}`).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.remove(LOADING_CLASS);
    node.removeAttribute('aria-busy');
    if (node instanceof HTMLButtonElement) node.disabled = false;
    node.querySelectorAll(`.${SPINNER_CLASS}`).forEach((spin) => spin.remove());
    node
      .querySelectorAll('.is-nav-loading-chip')
      .forEach((chip) => chip.classList.remove('is-nav-loading-chip'));
  });
  document.querySelectorAll(`.${LABEL_LOADING_CLASS}`).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.classList.remove(LABEL_LOADING_CLASS);
    node.querySelectorAll(`:scope > .${SPINNER_CLASS}`).forEach((spin) => spin.remove());
    const hit = node.closest('.asset-alien-photo-hit');
    if (hit instanceof HTMLElement) hit.removeAttribute('aria-busy');
  });
}

export { normalizePath as normalizeNavPath };
