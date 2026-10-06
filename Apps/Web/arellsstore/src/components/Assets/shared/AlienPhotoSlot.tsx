'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

function comingSoonLines(assetName?: string) {
  const name = assetName?.trim() || 'asset';
  return [
    'Add yourself',
    'inside the',
    name,
    'Alien Race',
    'Episodes.',
    '-',
    'coming soon',
    'stay tuned',
  ];
}

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const openPopup = useCallback(() => {
    setOverlayStyle(themeStyleFrom(triggerRef.current));
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const emptyLabel = EMPTY_LABEL_LINES.join(' ');

  return (
    <div className={`asset-alien-photo-slot asset-alien-photo-slot--${assetId}`}>
      <button
        ref={triggerRef}
        type="button"
        className="asset-alien-photo-hit"
        onClick={openPopup}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={emptyLabel}
      >
        <span className="asset-alien-photo-slot-placeholder-wrap">
          <img
            className="asset-alien-photo-slot-placeholder"
            src={PLACEHOLDER_SRC}
            alt=""
            aria-hidden="true"
          />
        </span>
        <span className="asset-alien-photo-label">
          {EMPTY_LABEL_LINES_DESKTOP.map((line) => (
            <span key={`desktop-${line}`} className="asset-alien-photo-label-line asset-alien-photo-label-line--desktop">
              {line}
            </span>
          ))}
          {EMPTY_LABEL_LINES.map((line) => (
            <span key={`mobile-${line}`} className="asset-alien-photo-label-line asset-alien-photo-label-line--mobile">
              {line}
            </span>
          ))}
        </span>
        <span className="asset-alien-photo-plus" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              fillRule="evenodd"
              d="M9.2 3.5 7.6 5.5H5.25A2.25 2.25 0 0 0 3 7.75v9.5A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25v-9.5A2.25 2.25 0 0 0 18.75 5.5H16.4l-1.6-2H9.2zM12 15.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"
            />
          </svg>
        </span>
      </button>
      {mounted && open
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={overlayStyle}
              onClick={close}
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
                  {comingSoonLines(assetName).map((line, index) => (
                    <span key={`${index}-${line}`} className="blood-overlay-line">
                      {line}
                    </span>
                  ))}
                </p>
                <button type="button" className="asset-range-button blood-ok" onClick={close}>
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
