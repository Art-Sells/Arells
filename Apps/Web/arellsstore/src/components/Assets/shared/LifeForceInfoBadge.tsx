'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type LifeForceInfoBadgeProps = {
  assetName?: string;
  variant?: 'asset' | 'investments';
};

const THEME_VARS = [
  '--asset-line-color',
  '--asset-hover-dot-color',
  '--asset-range-button-label-color',
  '--asset-slogan-color',
  '--myinv-accent-color',
] as const;

function lifeForceDescription(variant: 'asset' | 'investments', assetName?: string) {
  if (variant === 'investments') {
    return [
      'The amount of',
      'investments you',
      'own dictates',
      'the Life Force',
      'your Aliens',
      'possess.',
    ].join('\n');
  }
  const name = assetName?.trim() || 'asset';
  return [
    'The amount of',
    `${name} investments`,
    'you own dictates',
    'the Life Force',
    `your ${name} Alien`,
    'possesses.',
  ].join('\n');
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

const LifeForceInfoBadge: React.FC<LifeForceInfoBadgeProps> = ({
  assetName,
  variant = 'asset',
}) => {
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

  const descriptionLines = lifeForceDescription(variant, assetName).split('\n');
  const isInvestments = variant === 'investments';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="life-force-badge"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Life Force"
        onClick={openPopup}
      >
        Life Force
      </button>
      {mounted && open
        ? createPortal(
            <div
              className="life-force-overlay is-visible"
              style={isInvestments ? undefined : overlayStyle}
              onClick={close}
              role="presentation"
            >
              <div
                className={`life-force-overlay-card${isInvestments ? ' myinv-accent-border' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
              >
                <span
                  className={`life-force-overlay-icon${isInvestments ? ' life-force-overlay-icon--investments' : ''}`}
                  aria-hidden="true"
                />
                <p id={titleId} className="life-force-overlay-copy">
                  {descriptionLines.map((line) => (
                    <span key={line} className="life-force-overlay-line">
                      {line}
                    </span>
                  ))}
                </p>
                <button
                  type="button"
                  className={
                    isInvestments
                      ? 'asset-range-button myinv-range-button'
                      : 'asset-range-button life-force-ok'
                  }
                  onClick={close}
                >
                  Ok
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default LifeForceInfoBadge;
