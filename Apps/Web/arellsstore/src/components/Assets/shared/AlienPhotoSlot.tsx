'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AlienCharacterPayModal from './AlienCharacterPayModal';
import AlienDcPromotionModal from './AlienDcPromotionModal';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { useUser } from '../../../context/UserContext';
import { dismissDcPromotion } from '../../../lib/alienDcPromotion';
import { ALIEN_COMPOSE_DONE_EVENT } from '../../../lib/assets/assetSharePath';
import {
  ALIEN_PHOTO_ACCEPT,
  cloneAlienPhotoFile,
} from '../../../lib/client/alienPhotoCompose';
import {
  CG_PAID_PENDING_EVENT,
  clearOpenGuideFlag,
  hasPaidCharacterCredit,
  peekPaidCreditPending,
} from '../../../lib/client/characterGenerationPay';
import { isPendingNavTarget, usePendingNavHref } from '../../../lib/client/navCircleLoader';

type AlienPhotoSlotProps = {
  assetId: string;
  assetName?: string;
};

const PLACEHOLDER_SRC =
  '/images/banners/assets/crypto/Bitcoin/Posters/personalalienplaceholder.jpg';

const EMPTY_LABEL_LINES = [
  'Add a photo of your',
  'face to include',
  'yourself in The',
  'Bitcoin Alien Race',
  'episodes',
] as const;

const EMPTY_LABEL_LINES_DESKTOP = [
  'Add a photo of your face to include',
  'yourself in The Bitcoin Alien Race',
  'episodes',
] as const;

const THEME_VARS = [
  '--asset-line-color',
  '--asset-hover-dot-color',
  '--asset-range-button-label-color',
  '--asset-slogan-color',
  '--myinv-accent-color',
] as const;

function themeStyleFrom(el: HTMLElement | null): React.CSSProperties {
  if (!el || typeof window === 'undefined') return {};
  const computed = window.getComputedStyle(el);
  const style: Record<string, string> = {};
  for (const name of THEME_VARS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) style[name] = value;
  }
  return style as React.CSSProperties;
}

const AlienPhotoSlot: React.FC<AlienPhotoSlotProps> = ({ assetId, assetName }) => {
  const titleId = useId();
  const { email, shareId, isSignedIn } = useUser();
  const { isCreatingAsset, blockIfCreating, startCreate, createProgress } =
    useAlienCharacterCreate();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [awaitingPhoto, setAwaitingPhoto] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const [creditChecking, setCreditChecking] = useState(false);

  const busy = isCreatingAsset(assetId);
  const displayName = assetName?.trim() || 'Bitcoin';
  /** Circle on the Create Character button from click until a photo is chosen. */
  const createCtaLoading = !busy && (creditChecking || payOpen || guideOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadExisting = useCallback(async () => {
    if (!isSignedIn || assetId !== 'bitcoin') {
      setPortraitUrl(null);
      return;
    }
    try {
      const res = await fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=portrait`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        setPortraitUrl(null);
        return;
      }
      const blob = await res.blob();
      setPortraitUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      setPortraitUrl(null);
    }
  }, [assetId, isSignedIn]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  useEffect(() => {
    const onDone = (event: Event) => {
      const detail = (event as CustomEvent<{ assetId?: string }>).detail;
      if (detail?.assetId === assetId) {
        setAwaitingPhoto(false);
        void loadExisting();
      }
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
  }, [assetId, loadExisting]);

  useEffect(() => {
    if (!isSignedIn || assetId !== 'bitcoin') {
      setAwaitingPhoto(false);
      return;
    }
    if (peekPaidCreditPending(assetId)) setAwaitingPhoto(true);
    let cancelled = false;
    void (async () => {
      try {
        const paid = await hasPaidCharacterCredit(assetId);
        if (!cancelled) {
          setAwaitingPhoto((prev) => paid || prev || peekPaidCreditPending(assetId));
        }
      } catch {
        if (!cancelled && peekPaidCreditPending(assetId)) setAwaitingPhoto(true);
      }
    })();
    const onPaid = () => setAwaitingPhoto(true);
    window.addEventListener(CG_PAID_PENDING_EVENT, onPaid);
    return () => {
      cancelled = true;
      window.removeEventListener(CG_PAID_PENDING_EVENT, onPaid);
    };
  }, [assetId, isSignedIn]);

  const closeComingSoon = useCallback(() => setComingSoonOpen(false), []);

  const myCharacterHref =
    assetId === 'bitcoin'
      ? shareId
        ? `/bitcoin/my-character/${shareId}`
        : '/bitcoin/my-character'
      : null;

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
    setAwaitingPhoto(true);
    setGuideOpen(true);
  }, []);

  /** ADD PHOTO — file picker only (payment already handled). */
  const triggerFilePicker = useCallback(() => {
    if (!isSignedIn || !email) return;
    if (blockIfCreating(themeStyleFrom(triggerRef.current))) return;
    clickFileInput();
  }, [isSignedIn, email, blockIfCreating, clickFileInput]);

  /* Post-checkout Add Photo modal is owned by AlienDcPromotionHost on /bitcoin. */

  const openPicker = useCallback(() => {
    const style = themeStyleFrom(triggerRef.current);
    setOverlayStyle(style);
    if (assetId !== 'bitcoin') {
      setComingSoonOpen(true);
      return;
    }
    if (!isSignedIn || !email || creditChecking) {
      return;
    }
    if (blockIfCreating(style)) return;
    setCreditChecking(true);
    void (async () => {
      try {
        const paid = await hasPaidCharacterCredit(assetId);
        if (paid) openGuide();
        else {
          setGuideOpen(false);
          setPayOpen(true);
        }
      } catch (err) {
        console.error('character credit check', err);
        setGuideOpen(false);
        setPayOpen(true);
      } finally {
        setCreditChecking(false);
      }
    })();
  }, [assetId, email, isSignedIn, creditChecking, blockIfCreating, openGuide]);

  const onFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !email) {
        event.target.value = '';
        return;
      }
      const input = event.target;
      const overlayStyle = themeStyleFrom(triggerRef.current);
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
          assetName: displayName,
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
    [assetId, displayName, email, shareId, startCreate]
  );

  const hasCharacter = Boolean(portraitUrl);
  const showCreating = !hasCharacter && busy;
  const ctaLabel = hasCharacter
    ? 'View My Character'
    : awaitingPhoto
      ? 'Upload Photo'
      : 'Create Character';
  const hitLabel = showCreating ? 'Creating Character' : ctaLabel;
  const thumbSrc = portraitUrl || PLACEHOLDER_SRC;
  const viewAsLink = Boolean(hasCharacter && myCharacterHref && !busy);
  usePendingNavHref();
  const viewNavLoading = Boolean(viewAsLink && isPendingNavTarget(myCharacterHref));

  const media = (
    <>
      <span className="asset-alien-photo-slot-placeholder-wrap">
        <img
          className="asset-alien-photo-slot-placeholder"
          src={thumbSrc}
          alt=""
          aria-hidden="true"
        />
      </span>
      {showCreating ? (
        <span className="asset-alien-photo-creating">
          <span className="asset-alien-photo-creating-title">
            <span className="asset-alien-photo-creating-title-text">Creating Character</span>
            <span className="asset-alien-photo-creating-loader">
              <span className="blood-overlay-creating-spinner" aria-hidden="true">
                <span className="blood-overlay-creating-spinner-ring" />
                {createProgress != null ? (
                  <span className="blood-overlay-creating-percent">{createProgress}%</span>
                ) : (
                  <span className="blood-overlay-creating-profile" />
                )}
              </span>
            </span>
            <span className="blood-overlay-creating-eta" aria-label="Estimated completion time">
              <span className="blood-overlay-creating-eta-line">estimated</span>
              <span className="blood-overlay-creating-eta-line">completion time</span>
              <span className="blood-overlay-creating-eta-time">5-10~ minutes</span>
            </span>
          </span>
        </span>
      ) : !hasCharacter ? (
        <span className="asset-alien-photo-label">
          {EMPTY_LABEL_LINES_DESKTOP.map((line) => (
            <span
              key={`desktop-${line}`}
              className="asset-alien-photo-label-line asset-alien-photo-label-line--desktop"
            >
              {line}
            </span>
          ))}
          {EMPTY_LABEL_LINES.map((line) => (
            <span
              key={`mobile-${line}`}
              className="asset-alien-photo-label-line asset-alien-photo-label-line--mobile"
            >
              {line}
            </span>
          ))}
        </span>
      ) : null}
      <span
        className={`asset-alien-photo-plus${
          hasCharacter ? ' asset-alien-photo-plus--view' : ''
        }${viewNavLoading || createCtaLoading || showCreating ? ' is-nav-loading-label' : ''}`}
        aria-hidden="true"
      >
        {hasCharacter ? (
          <span className="asset-alien-photo-plus-label-text">View My Character</span>
        ) : (
          <>
            <span className="asset-alien-photo-create-character-icon" aria-hidden="true" />
            <span>{ctaLabel}</span>
          </>
        )}
      </span>
    </>
  );

  return (
    <div
      className={`asset-alien-photo-slot asset-alien-photo-slot--${assetId}${
        showCreating || busy ? ' is-busy' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ALIEN_PHOTO_ACCEPT}
        hidden
        onChange={onFile}
      />
      {viewAsLink && myCharacterHref ? (
        <Link
          href={myCharacterHref}
          className="asset-alien-photo-hit"
          aria-label={hitLabel}
        >
          {media}
        </Link>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="asset-alien-photo-hit"
          onClick={openPicker}
          disabled={showCreating || busy}
          aria-expanded={comingSoonOpen}
          aria-haspopup="dialog"
          aria-label={hitLabel}
        >
          {media}
        </button>
      )}
      {assetId === 'bitcoin' ? (
        <>
          <AlienCharacterPayModal
            open={payOpen}
            assetId={assetId}
            overlayStyle={overlayStyle}
            onPaid={openGuide}
            onDismiss={() => setPayOpen(false)}
          />
          <AlienDcPromotionModal
            open={guideOpen}
            assetName={displayName}
            overlayStyle={overlayStyle}
            onAddPhoto={triggerFilePicker}
            onDismiss={() => {
              clearOpenGuideFlag();
              setGuideOpen(false);
            }}
          />
        </>
      ) : null}
      {mounted && comingSoonOpen
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={overlayStyle}
              onClick={closeComingSoon}
              role="presentation"
            >
              <div
                className="blood-overlay-card blood-overlay-card--coming-soon"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
              >
                <span className="blood-overlay-icon" aria-hidden="true" />
                <p id={titleId} className="blood-overlay-copy">
                  <span className="blood-overlay-line">Add yourself</span>
                  <span className="blood-overlay-line">inside the</span>
                  <span className="blood-overlay-line">{displayName}</span>
                  <span className="blood-overlay-line">Alien Race</span>
                  <span className="blood-overlay-line">Episodes.</span>
                </p>
                <button type="button" className="asset-range-button blood-ok" onClick={closeComingSoon}>
                  Ok
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default AlienPhotoSlot;
