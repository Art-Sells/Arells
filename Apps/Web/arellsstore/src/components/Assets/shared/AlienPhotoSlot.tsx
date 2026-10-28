'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { useUser } from '../../../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT } from '../../../lib/assets/assetSharePath';

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
  const { isCreatingAsset, blockIfCreating, startCreate } = useAlienCharacterCreate();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  const busy = isCreatingAsset(assetId);
  const displayName = assetName?.trim() || 'Bitcoin';

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
      if (detail?.assetId === assetId) void loadExisting();
    };
    window.addEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
    return () => window.removeEventListener(ALIEN_COMPOSE_DONE_EVENT, onDone);
  }, [assetId, loadExisting]);

  const closeComingSoon = useCallback(() => setComingSoonOpen(false), []);

  const myCharacterHref =
    assetId === 'bitcoin'
      ? shareId
        ? `/bitcoin/my-character/${shareId}`
        : '/bitcoin/my-character'
      : null;

  const openPicker = useCallback(() => {
    const style = themeStyleFrom(triggerRef.current);
    setOverlayStyle(style);
    if (assetId !== 'bitcoin') {
      setComingSoonOpen(true);
      return;
    }
    if (!isSignedIn || !email) {
      return;
    }
    if (blockIfCreating(style)) return;
    const input = fileInputRef.current;
    if (input) {
      try {
        input.value = '';
        input.type = 'text';
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp';
      } catch {
        input.value = '';
      }
      input.click();
    }
  }, [assetId, email, isSignedIn, blockIfCreating]);

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
        assetName: displayName,
        file,
        shareId,
        overlayStyle: themeStyleFrom(triggerRef.current),
      });
    },
    [assetId, displayName, email, shareId, startCreate]
  );

  const hasCharacter = Boolean(portraitUrl);
  const emptyLabel = EMPTY_LABEL_LINES.join(' ');
  const hitLabel = busy
    ? 'Creating character'
    : hasCharacter
      ? 'View My Character'
      : emptyLabel;
  const thumbSrc = portraitUrl || PLACEHOLDER_SRC;
  const viewAsLink = Boolean(hasCharacter && myCharacterHref && !busy);

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
      {!hasCharacter ? (
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
          hasCharacter || busy ? ' asset-alien-photo-plus--view' : ''
        }${busy ? ' asset-alien-photo-plus--creating' : ''}`}
        aria-hidden="true"
      >
        {busy ? (
          <>
            <span className="asset-alien-photo-creating-word">creating</span>
            <span className="asset-alien-photo-busy" />
            <span className="asset-alien-photo-creating-word">character</span>
          </>
        ) : hasCharacter ? (
          'View My Character'
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              fillRule="evenodd"
              d="M9.2 3.5 7.6 5.5H5.25A2.25 2.25 0 0 0 3 7.75v9.5A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25v-9.5A2.25 2.25 0 0 0 18.75 5.5H16.4l-1.6-2H9.2zM12 15.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"
            />
          </svg>
        )}
      </span>
    </>
  );

  return (
    <div
      className={`asset-alien-photo-slot asset-alien-photo-slot--${assetId}${
        busy ? ' is-busy' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
          disabled={busy}
          aria-expanded={comingSoonOpen}
          aria-haspopup="dialog"
          aria-label={hitLabel}
        >
          {media}
        </button>
      )}
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
                  <span className="blood-overlay-line">-</span>
                  <span className="blood-overlay-line">coming soon</span>
                  <span className="blood-overlay-line">stay tuned</span>
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
