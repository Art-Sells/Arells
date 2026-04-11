/**
 * Document scroll helpers for asset pages: clamped targets, visual viewport height,
 * and a short lock while the user touch/wheel-scrolls so RAF followers don't fight the browser.
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

const USER_SCROLL_LOCK_MS = 480;
let userDrivenScrollLockUntil = 0;

export function markUserDrivenScroll(): void {
  userDrivenScrollLockUntil = Date.now() + USER_SCROLL_LOCK_MS;
}

export function isUserDrivenScrollLocked(): boolean {
  return Date.now() < userDrivenScrollLockUntil;
}

export function installUserScrollGestureListeners(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onWheel = () => markUserDrivenScroll();
  const onTouchMove = () => markUserDrivenScroll();
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchmove', onTouchMove);
  };
}
