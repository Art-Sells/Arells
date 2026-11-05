'use client';

import { useEffect, useRef } from 'react';

const FALLBACK_MS = 30000;

function mountShell(page: Element): HTMLElement | null {
  const shells = page.querySelectorAll('.asset-header-panel > .asset-slide-panel');
  for (const shell of shells) {
    if (shell.querySelector('.asset-investments-header, .asset-portfolio-summary-box')) {
      return shell as HTMLElement;
    }
  }
  return null;
}

/** Visible height has caught up with the section content (height-down finished). */
function shellSettled(shell: HTMLElement) {
  const visible = shell.offsetHeight;
  if (visible < 8) return false;
  const full = shell.scrollHeight;
  if (full > 8 && visible >= full - 2) return true;
  const maxHeight = window.getComputedStyle(shell).maxHeight;
  if (maxHeight === 'none') return true;
  const target = parseFloat(maxHeight);
  return Number.isFinite(target) && visible >= target - 2;
}

/** Hide the asset footer until the mount height-down on the character shell finishes. */
export default function AssetFooterHold() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const page = ref.current?.closest('.asset-page');
    if (!page) return;

    page.classList.add('asset-page--footer-held');
    let finished = false;
    let sawClosed = false;
    let settledSince = 0;
    let fadeFrame = 0;

    const finish = () => {
      if (finished) return;
      finished = true;
      page.classList.remove('asset-page--footer-held');
      page.classList.add('asset-page--footer-fade');
      fadeFrame = window.requestAnimationFrame(() => {
        fadeFrame = window.requestAnimationFrame(() => {
          page.classList.remove('asset-page--footer-fade');
        });
      });
    };

    const tick = () => {
      if (finished) return;
      const shell = mountShell(page);
      if (!shell) return;
      if (shell.offsetHeight < 8) {
        sawClosed = true;
        settledSince = 0;
        return;
      }
      if (!shellSettled(shell)) {
        settledSince = 0;
        return;
      }
      if (sawClosed) {
        finish();
        return;
      }
      const now = performance.now();
      if (!settledSince) settledSince = now;
      else if (now - settledSince > 400) finish();
    };

    const interval = window.setInterval(tick, 100);
    const fallback = window.setTimeout(finish, FALLBACK_MS);
    tick();

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fallback);
      if (fadeFrame) window.cancelAnimationFrame(fadeFrame);
      page.classList.remove('asset-page--footer-held');
      page.classList.remove('asset-page--footer-fade');
    };
  }, []);

  return <span ref={ref} hidden aria-hidden="true" />;
}
