/**
 * Document scroll helpers for asset pages: clamped targets and visual viewport height.
 */

export function getVisualViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height ?? window.innerHeight;
}

export function getDocumentScrollHeight(): number {
  if (typeof document === 'undefined') return 0;
  const scroller = document.scrollingElement ?? document.documentElement;
  return Math.max(
    scroller?.scrollHeight ?? 0,
    document.documentElement?.scrollHeight ?? 0,
    document.body?.scrollHeight ?? 0
  );
}

export function getMaxScrollY(): number {
  const docH = getDocumentScrollHeight();
  const vh = getVisualViewportHeight();
  return Math.max(0, docH - vh);
}

export function getScrollY(): number {
  if (typeof window === 'undefined') return 0;
  const scroller = document.scrollingElement ?? document.documentElement;
  return scroller?.scrollTop ?? window.scrollY ?? 0;
}

export function scrollDocumentToY(top: number, behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined') return;
  const maxY = getMaxScrollY();
  const clamped = Math.min(maxY, Math.max(0, top));
  window.scrollTo({ top: clamped, left: 0, behavior });
}

export function scrollDocumentToBottom(behavior: ScrollBehavior = 'auto'): void {
  scrollDocumentToY(getMaxScrollY(), behavior);
}

/**
 * Skip frame-by-frame scroll followers on mobile: they fight touch scrolling and iOS momentum (visible jitter).
 * Matches asset layout breakpoint (750) and coarse pointers (phones, most tablets).
 */
export function skipAssetPageScrollFollowRaf(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches === true;
  const narrow = window.matchMedia?.('(max-width: 749px)')?.matches === true;
  return coarse || narrow;
}
