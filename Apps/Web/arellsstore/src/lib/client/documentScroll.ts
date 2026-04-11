/**
 * Document scroll helpers for asset pages: clamped targets, visual viewport height,
 * and timed scroll-to-bottom after layout / transitions settle.
 */

export const ASSET_PAGE_SCROLL_BOTTOM_MS = 2000;

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

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

let bottomScrollRafId: number | null = null;

export function cancelDocumentBottomScrollAnimation(): void {
  if (typeof window === 'undefined') return;
  if (bottomScrollRafId != null) {
    cancelAnimationFrame(bottomScrollRafId);
    bottomScrollRafId = null;
  }
}

/**
 * Smooth scroll from current position toward document bottom over `durationMs`.
 * Re-reads max scroll each frame so a slightly late layout shift still ends at the true bottom.
 */
export function scrollDocumentToBottomOverMs(
  durationMs: number,
  opts?: { respectReducedMotion?: boolean }
): () => void {
  cancelDocumentBottomScrollAnimation();
  const cancel = () => cancelDocumentBottomScrollAnimation();
  if (typeof window === 'undefined') return cancel;
  if (
    opts?.respectReducedMotion !== false &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  ) {
    scrollDocumentToBottom('auto');
    return cancel;
  }
  const t0 = performance.now();
  const start = getScrollY();
  const tick = (now: number) => {
    const maxY = getMaxScrollY();
    const elapsed = now - t0;
    const u = Math.min(1, elapsed / durationMs);
    if (u >= 1) {
      scrollDocumentToY(maxY, 'auto');
      bottomScrollRafId = null;
      return;
    }
    const eased = easeOutCubic(u);
    const target = start + (maxY - start) * eased;
    scrollDocumentToY(target, 'auto');
    bottomScrollRafId = requestAnimationFrame(tick);
  };
  bottomScrollRafId = requestAnimationFrame(tick);
  return cancel;
}

/** When `document` scroll height stops changing for `stableMs`, or after `timeoutMs`. */
export function runAfterDocumentHeightStable(
  callback: () => void,
  options?: { stableMs?: number; timeoutMs?: number }
): () => void {
  const stableMs = options?.stableMs ?? 100;
  const timeoutMs = options?.timeoutMs ?? 6000;
  let rafId: number | null = null;
  let cancelled = false;
  const deadline = performance.now() + timeoutMs;
  let lastH = -1;
  let stableSince: number | null = null;

  const cancel = () => {
    cancelled = true;
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const loop = () => {
    if (cancelled) return;
    const h = getDocumentScrollHeight();
    if (h !== lastH) {
      lastH = h;
      stableSince = null;
    } else {
      const now = performance.now();
      if (stableSince == null) stableSince = now;
      else if (now - stableSince >= stableMs) {
        cancel();
        callback();
        return;
      }
    }
    if (performance.now() >= deadline) {
      cancel();
      callback();
      return;
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
  return cancel;
}

/**
 * After `max-height` transition completes on `element`, or `timeoutMs` (no transition / reduced motion).
 */
export function runAfterMaxHeightTransitionEnd(
  element: Element | null | undefined,
  callback: () => void,
  options?: { timeoutMs?: number }
): () => void {
  const timeoutMs = options?.timeoutMs ?? 4000;
  let done = false;
  let timer: ReturnType<typeof globalThis.setTimeout> | null = null;
  const finish = () => {
    if (done) return;
    done = true;
    if (timer != null) {
      globalThis.clearTimeout(timer);
      timer = null;
    }
    if (element) {
      element.removeEventListener('transitionend', onEnd as EventListener);
    }
    callback();
  };
  const onEnd = (e: Event) => {
    const te = e as TransitionEvent;
    if (te.target !== element) return;
    if (te.propertyName !== 'max-height') return;
    finish();
  };

  if (!element || typeof window === 'undefined') {
    return runAfterDocumentHeightStable(callback, { stableMs: 120, timeoutMs: timeoutMs });
  }

  element.addEventListener('transitionend', onEnd as EventListener);
  timer = globalThis.setTimeout(finish, timeoutMs);
  return () => {
    if (done) return;
    done = true;
    if (timer != null) globalThis.clearTimeout(timer);
    element.removeEventListener('transitionend', onEnd as EventListener);
  };
}
