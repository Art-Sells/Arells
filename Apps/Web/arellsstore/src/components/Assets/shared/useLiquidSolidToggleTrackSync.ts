'use client';

import { useLayoutEffect, type RefObject } from 'react';

type ToggleDragRef = { current: { active: boolean } };
type ToggleAnimRafRef = { current: number | null };

const MOBILE_ASSET_LAYOUT_MQ = '(max-width: 750px)';

/**
 * Keeps Liquid/Solid toggle track metrics in sync on resize / breakpoint changes.
 * Clears stale pixel knob overrides so idle layout defers to CSS (percent/inset based).
 */
export function useLiquidSolidToggleTrackSync(
  toggleBtnRef: RefObject<HTMLButtonElement | null>,
  toggleDragRef: ToggleDragRef,
  toggleAnimRafRef: ToggleAnimRafRef,
  measureToggleTrack: () => unknown,
  setToggleKnobLeftPx: (value: number | null) => void
) {
  useLayoutEffect(() => {
    const btn = toggleBtnRef.current;
    if (!btn) return;

    const clearKnobOverride = () => {
      setToggleKnobLeftPx(null);
      btn.style.removeProperty('--toggle-knob-left');
    };

    const syncTrack = () => {
      measureToggleTrack();
      if (!toggleDragRef.current.active && toggleAnimRafRef.current == null) {
        clearKnobOverride();
      }
    };

    syncTrack();
    let raf: number | null = null;
    const scheduleSync = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        requestAnimationFrame(() => {
          syncTrack();
        });
      });
    };

    const ro = new ResizeObserver(scheduleSync);
    ro.observe(btn);

    const mq = window.matchMedia(MOBILE_ASSET_LAYOUT_MQ);
    const onMqChange = () => scheduleSync();
    mq.addEventListener('change', onMqChange);
    window.addEventListener('resize', scheduleSync);

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener('change', onMqChange);
      window.removeEventListener('resize', scheduleSync);
    };
  }, [measureToggleTrack, setToggleKnobLeftPx, toggleAnimRafRef, toggleBtnRef, toggleDragRef]);
}
