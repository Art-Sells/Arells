'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import AlienDcPromotionModal from './AlienDcPromotionModal';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { useUser } from '../../../context/UserContext';
import {
  dismissDcPromotion,
  hasDismissedDcPromotion,
} from '../../../lib/alienDcPromotion';
import { ALIEN_PHOTO_ACCEPT } from '../../../lib/client/alienPhotoCompose';

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
  assetId?: string;
  /** CSS selector used to pull asset theme vars for the portal. */
  themeSelector?: string;
};

/**
 * Auto-shows the DC promo until a photo is recorded (Add Photo → picker → file).
 * PHOTO / Update Photo reopen is handled by those controls.
 */
const AlienDcPromotionHost: React.FC<AlienDcPromotionHostProps> = ({
  enabled,
  assetName = 'Bitcoin',
  assetId = 'bitcoin',
  themeSelector = '.asset-page--bitcoin',
}) => {
  const { email, shareId, isSignedIn } = useUser();
  const { blockIfCreating, startCreate } = useAlienCharacterCreate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!enabled) return;
    if (hasDismissedDcPromotion()) return;
    setOverlayStyle(themeStyleFrom(document.querySelector(themeSelector)));
    setOpen(true);
  }, [enabled, themeSelector]);

  const openPicker = useCallback(() => {
    if (!isSignedIn || !email) return;
    if (blockIfCreating(overlayStyle)) return;
    const input = fileInputRef.current;
    if (!input) return;
    try {
      input.value = '';
      input.type = 'text';
      input.type = 'file';
      input.accept = ALIEN_PHOTO_ACCEPT;
    } catch {
      input.value = '';
    }
    input.click();
  }, [isSignedIn, email, blockIfCreating, overlayStyle]);

  const onFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !email) {
        event.target.value = '';
        return;
      }
      event.target.value = '';
      startCreate({
        email,
        assetId,
        assetName,
        file,
        shareId,
        overlayStyle,
      });
      dismissDcPromotion();
      setOpen(false);
    },
    [email, assetId, assetName, shareId, overlayStyle, startCreate]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALIEN_PHOTO_ACCEPT}
        hidden
        onChange={onFile}
      />
      <AlienDcPromotionModal
        open={open}
        assetName={assetName}
        overlayStyle={overlayStyle}
        onAddPhoto={openPicker}
      />
    </>
  );
};

export default AlienDcPromotionHost;
