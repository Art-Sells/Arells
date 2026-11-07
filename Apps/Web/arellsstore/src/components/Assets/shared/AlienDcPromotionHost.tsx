'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import AlienCharacterPayModal from './AlienCharacterPayModal';
import AlienDcPromotionModal from './AlienDcPromotionModal';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { useUser } from '../../../context/UserContext';
import { useAlienCharacterPresent } from '../../../hooks/useAlienCharacterPresent';
import { dismissDcPromotion } from '../../../lib/alienDcPromotion';
import {
  ALIEN_PHOTO_ACCEPT,
  cloneAlienPhotoFile,
} from '../../../lib/client/alienPhotoCompose';
import {
  clearOpenGuideFlag,
  handleCharacterGenerationCheckoutReturn,
  peekOpenGuideFlag,
} from '../../../lib/client/characterGenerationPay';

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
 * Auto-show only right after Stripe checkout. A normal Bitcoin mount does not open either modal.
 */
const AlienDcPromotionHost: React.FC<AlienDcPromotionHostProps> = ({
  enabled,
  assetName = 'Bitcoin',
  assetId = 'bitcoin',
  themeSelector = '.asset-page--bitcoin',
}) => {
  const { email, shareId, isSignedIn } = useUser();
  const { blockIfCreating, startCreate } = useAlienCharacterCreate();
  const { hasCharacter, ready: characterReady } = useAlienCharacterPresent(assetId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  const clickFileInput = useCallback(() => {
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
  }, []);

  const openGuide = useCallback(() => {
    setPayOpen(false);
    setGuideOpen(true);
  }, []);

  useEffect(() => {
    if (!enabled || !isSignedIn || !email || !characterReady) return;
    // Already has a My Character portrait — never auto-spam the promo.
    if (hasCharacter) {
      dismissDcPromotion();
      clearOpenGuideFlag();
      setGuideOpen(false);
      setPayOpen(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const style = themeStyleFrom(document.querySelector(themeSelector));
      setOverlayStyle(style);

      let fromCheckout = false;
      try {
        fromCheckout = await handleCharacterGenerationCheckoutReturn();
      } catch (err) {
        console.error('character checkout return', err);
      }
      if (cancelled) return;

      /* Only the payment return (and its immediate redirect) opens Add Photo. */
      if (fromCheckout || peekOpenGuideFlag()) {
        openGuide();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, isSignedIn, email, assetId, themeSelector, openGuide, hasCharacter, characterReady]);

  const onAddPhoto = useCallback(() => {
    if (!isSignedIn || !email) return;
    if (blockIfCreating(overlayStyle)) return;
    clickFileInput();
  }, [isSignedIn, email, blockIfCreating, overlayStyle, clickFileInput]);

  const onFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !email) {
        event.target.value = '';
        return;
      }
      const input = event.target;
      void (async () => {
        let stable: File;
        try {
          /* Snapshot before clearing — iOS can revoke the input's File blob. */
          stable = await cloneAlienPhotoFile(file);
        } catch (err) {
          console.error('alien photo clone', err);
          input.value = '';
          return;
        }
        input.value = '';
        startCreate({
          email,
          assetId,
          assetName,
          file: stable,
          shareId,
          overlayStyle,
        });
        dismissDcPromotion();
        clearOpenGuideFlag();
        setGuideOpen(false);
        setPayOpen(false);
      })();
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
      <AlienCharacterPayModal
        open={payOpen}
        assetId={assetId}
        overlayStyle={overlayStyle}
        onPaid={openGuide}
        onDismiss={() => setPayOpen(false)}
      />
      <AlienDcPromotionModal
        open={guideOpen}
        assetName={assetName}
        overlayStyle={overlayStyle}
        onAddPhoto={onAddPhoto}
        onDismiss={() => {
          dismissDcPromotion();
          clearOpenGuideFlag();
          setGuideOpen(false);
        }}
      />
    </>
  );
};

export default AlienDcPromotionHost;
