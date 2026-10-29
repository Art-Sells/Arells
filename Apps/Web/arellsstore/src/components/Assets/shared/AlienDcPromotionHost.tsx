'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AlienDcPromotionModal from './AlienDcPromotionModal';
import { hasDismissedDcPromotion } from '../../../lib/alienDcPromotion';

const THEME_VARS = [
  '--asset-line-color',
  '--asset-hover-dot-color',
  '--asset-range-button-label-color',
  '--asset-slogan-color',
  '--myinv-accent-color',
] as const;

function themeStyleFrom(el: Element | null): React.CSSProperties {
  if (!el || typeof window === 'undefined') return {};
  const computed = window.getComputedStyle(el);
  const style: Record<string, string> = {};
  for (const name of THEME_VARS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) style[name] = value;
  }
  return style as React.CSSProperties;
}

type AlienDcPromotionHostProps = {
  /** When false, do not auto-open (guest / still loading). */
  enabled: boolean;
  assetName?: string;
  /** CSS selector used to pull asset theme vars for the portal. */
  themeSelector?: string;
};

/**
 * Auto-shows the DC promo once per browser until OK.
 * PHOTO reopen is handled by AlienPhotoSlot.
 */
const AlienDcPromotionHost: React.FC<AlienDcPromotionHostProps> = ({
  enabled,
  assetName = 'Bitcoin',
  themeSelector = '.asset-page--bitcoin',
}) => {
  const [open, setOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!enabled) return;
    if (hasDismissedDcPromotion()) return;
    setOverlayStyle(themeStyleFrom(document.querySelector(themeSelector)));
    setOpen(true);
  }, [enabled, themeSelector]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <AlienDcPromotionModal
      open={open}
      onClose={close}
      assetName={assetName}
      overlayStyle={overlayStyle}
      persistOk
    />
  );
};

export default AlienDcPromotionHost;
