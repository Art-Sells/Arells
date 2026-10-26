'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../context/UserContext';
import { ALIEN_COMPOSE_DONE_EVENT, assetSharePath } from '../../../lib/assets/assetSharePath';

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

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read photo'));
    };
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(file);
  });
}

const AlienPhotoSlot: React.FC<AlienPhotoSlotProps> = ({ assetId, assetName }) => {
  const titleId = useId();
  const router = useRouter();
  const { email, shareId, isSignedIn } = useUser();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [metaUrl, setMetaUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

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
      setPortraitUrl(URL.createObjectURL(blob));
    } catch {
      setPortraitUrl(null);
    }
  }, [assetId, isSignedIn]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const closeComingSoon = useCallback(() => setComingSoonOpen(false), []);

  const openPicker = useCallback(() => {
    setOverlayStyle(themeStyleFrom(triggerRef.current));
    setError(null);
    if (assetId !== 'bitcoin') {
      setComingSoonOpen(true);
      return;
    }
    if (!isSignedIn || !email) {
      setError('Sign in to add your character');
      return;
    }
    fileInputRef.current?.click();
  }, [assetId, email, isSignedIn]);

  const onFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !email) return;
      setBusy(true);
      setError(null);
      try {
        const data = await fileToDataUrl(file);
        const uploadRes = await fetch('/api/user/alien-photo', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, asset: assetId, data }),
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(uploadJson.error || 'Upload failed');
        }

        const composeRes = await fetch('/api/user/alien-compose', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, asset: assetId, mode: 'full' }),
        });
        const composeJson = await composeRes.json().catch(() => ({}));
        if (!composeRes.ok) {
          throw new Error(composeJson.error || 'Character generation failed');
        }

        const [portraitRes, metaRes] = await Promise.all([
          fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=portrait`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch(`/api/user/alien-photo?asset=${encodeURIComponent(assetId)}&kind=composed`, {
            credentials: 'include',
            cache: 'no-store',
          }),
        ]);
        if (!portraitRes.ok || !metaRes.ok) {
          throw new Error('Could not load generated images');
        }
        const [portraitBlob, metaBlob] = await Promise.all([portraitRes.blob(), metaRes.blob()]);
        setPortraitUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(portraitBlob);
        });
        setMetaUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return URL.createObjectURL(metaBlob);
        });
        setOverlayStyle(themeStyleFrom(triggerRef.current));
        setSuccessOpen(true);
        window.dispatchEvent(
          new CustomEvent(ALIEN_COMPOSE_DONE_EVENT, {
            detail: { assetId, shareId, at: Date.now() },
          })
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setBusy(false);
      }
    },
    [assetId, email, shareId]
  );

  const onSuccessOk = useCallback(() => {
    setSuccessOpen(false);
    const href = assetSharePath(`/${assetId === 'bitcoin' ? 'bitcoin' : assetId}`, shareId);
    if (shareId && typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '');
      if (path === '/bitcoin' || path.startsWith('/bitcoin/')) {
        router.replace(href);
        return;
      }
    }
    router.push(href);
  }, [assetId, router, shareId]);

  const emptyLabel = EMPTY_LABEL_LINES.join(' ');
  const thumbSrc = portraitUrl || PLACEHOLDER_SRC;

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
      <button
        ref={triggerRef}
        type="button"
        className="asset-alien-photo-hit"
        onClick={openPicker}
        disabled={busy}
        aria-expanded={successOpen || comingSoonOpen}
        aria-haspopup="dialog"
        aria-label={emptyLabel}
      >
        <span className="asset-alien-photo-slot-placeholder-wrap">
          <img
            className="asset-alien-photo-slot-placeholder"
            src={thumbSrc}
            alt=""
            aria-hidden="true"
          />
        </span>
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
        <span className="asset-alien-photo-plus" aria-hidden="true">
          {busy ? (
            <span className="asset-alien-photo-busy" />
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fillRule="evenodd"
                d="M9.2 3.5 7.6 5.5H5.25A2.25 2.25 0 0 0 3 7.75v9.5A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25v-9.5A2.25 2.25 0 0 0 18.75 5.5H16.4l-1.6-2H9.2zM12 15.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"
              />
            </svg>
          )}
        </span>
      </button>
      {error ? <p className="asset-alien-photo-error">{error}</p> : null}
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
                  <span className="blood-overlay-line">{assetName?.trim() || 'asset'}</span>
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
      {mounted && successOpen && metaUrl
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={overlayStyle}
              role="presentation"
            >
              <div
                className="blood-overlay-card blood-overlay-card--alien-meta"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${titleId}-success`}
                onClick={(event) => event.stopPropagation()}
              >
                <p id={`${titleId}-success`} className="blood-overlay-copy">
                  <span className="blood-overlay-line">You&apos;re in The Bitcoin Alien Race</span>
                </p>
                <img
                  className="asset-alien-meta-preview"
                  src={metaUrl}
                  alt="Your personalized Bitcoin Alien Race poster"
                />
                {shareId ? (
                  <p className="asset-alien-share-hint">
                    Share link:{' '}
                    <span>
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}${assetSharePath('/bitcoin', shareId)}`
                        : assetSharePath('/bitcoin', shareId)}
                    </span>
                  </p>
                ) : null}
                <button type="button" className="asset-range-button blood-ok" onClick={onSuccessOk}>
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
