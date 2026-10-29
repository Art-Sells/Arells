'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { assetSharePath } from '../../../lib/assets/assetSharePath';
import AlienMetaPreview from './AlienMetaPreview';

/** True on the asset home (optional shareId) or My Character routes for that asset. */
function isOnAssetOrCharacterPage(pathname: string, assetId: string): boolean {
  const id = assetId.trim().toLowerCase() || 'bitcoin';
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assetHome = new RegExp(`^/${escaped}(?:/[a-z0-9]{6,64})?/?$`, 'i');
  const myCharacter = new RegExp(`^/${escaped}/my-character(?:/[a-z0-9]{6,64})?/?$`, 'i');
  return assetHome.test(pathname) || myCharacter.test(pathname);
}

/**
 * UI-edit preview: force success modal on every page mount / route change.
 * Set back to false after editing/verification is done.
 */
const FORCE_ALIEN_SUCCESS_MODAL_PREVIEW = true;

type PreviewSuccess = {
  assetId: string;
  assetName: string;
  shareId: string;
  metaUrl: string;
  loopUrl: string | null;
};

/** Sitewide alien create modals: creating / wait / success / error. */
export default function AlienCharacterCreateHost() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const {
    creatingModalOpen,
    waitModalOpen,
    waitAssetName,
    success: liveSuccess,
    error,
    errorOpen,
    overlayStyle: liveOverlayStyle,
    creatingAssetName,
    dismissCreatingModal,
    dismissWaitModal,
    dismissSuccess,
    dismissError,
  } = useAlienCharacterCreate();

  /** While FORCE is on, Close can hide once — next route/mount brings it back. */
  const [previewDismissed, setPreviewDismissed] = useState(false);
  const [previewSuccess, setPreviewSuccess] = useState<PreviewSuccess | null>(null);
  const previewBlobUrlsRef = useRef<{ meta?: string; loop?: string }>({});
  const success =
    FORCE_ALIEN_SUCCESS_MODAL_PREVIEW && !previewDismissed && previewSuccess
      ? previewSuccess
      : liveSuccess;
  const overlayStyle =
    FORCE_ALIEN_SUCCESS_MODAL_PREVIEW && !previewDismissed && previewSuccess
      ? ({
          ['--asset-hover-dot-color' as string]: 'rgba(248, 141, 0, 1)',
          ['--asset-line-color' as string]: 'rgba(248, 141, 0, 1)',
          ['--myinv-accent-color' as string]: 'rgba(248, 141, 0, 1)',
        } as React.CSSProperties)
      : liveOverlayStyle;

  const onDismissSuccess = useCallback(() => {
    if (FORCE_ALIEN_SUCCESS_MODAL_PREVIEW) setPreviewDismissed(true);
    dismissSuccess();
  }, [dismissSuccess]);

  const [mounted, setMounted] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareCopiedTimerRef = useRef<number | null>(null);
  const creatingTitleId = useId();
  const waitTitleId = useId();
  const errorTitleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force preview: load composed + metaloop as blobs (same as real create) and reopen each route.
  useEffect(() => {
    if (!FORCE_ALIEN_SUCCESS_MODAL_PREVIEW) return;
    let cancelled = false;
    setPreviewDismissed(false);

    const revokePreview = () => {
      const prev = previewBlobUrlsRef.current;
      if (prev.meta?.startsWith('blob:')) URL.revokeObjectURL(prev.meta);
      if (prev.loop?.startsWith('blob:')) URL.revokeObjectURL(prev.loop);
      previewBlobUrlsRef.current = {};
    };

    void (async () => {
      const bust = `t=${Date.now()}`;
      try {
        const [metaRes, loopRes] = await Promise.all([
          fetch(`/api/user/alien-photo?asset=bitcoin&kind=composed&${bust}`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch(`/api/user/alien-photo?asset=bitcoin&kind=metaloop&${bust}`, {
            credentials: 'include',
            cache: 'no-store',
          }),
        ]);
        if (cancelled) return;
        if (!metaRes.ok) {
          setPreviewSuccess(null);
          return;
        }
        const metaBlob = await metaRes.blob();
        const loopBlob = loopRes.ok ? await loopRes.blob() : null;
        if (cancelled) return;
        revokePreview();
        const metaUrl = URL.createObjectURL(metaBlob);
        const loopUrl = loopBlob ? URL.createObjectURL(loopBlob) : null;
        previewBlobUrlsRef.current = { meta: metaUrl, loop: loopUrl || undefined };
        setPreviewSuccess({
          assetId: 'bitcoin',
          assetName: 'Bitcoin',
          shareId: 'preview',
          metaUrl,
          loopUrl,
        });
      } catch (err) {
        console.error('alien success modal preview', err);
        if (!cancelled) setPreviewSuccess(null);
      }
    })();

    return () => {
      cancelled = true;
      setPreviewSuccess(null);
      revokePreview();
    };
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (shareCopiedTimerRef.current != null) {
        window.clearTimeout(shareCopiedTimerRef.current);
      }
    };
  }, []);

  const sharePath = assetSharePath(
    `/${success?.assetId === 'bitcoin' || !success?.assetId ? 'bitcoin' : success.assetId}`,
    success?.shareId
  );
  const shareHref =
    typeof window !== 'undefined' ? `${window.location.origin}${sharePath}` : sharePath;

  const copyShareLink = useCallback(async () => {
    if (!success?.shareId) return;
    try {
      await navigator.clipboard.writeText(shareHref);
      setShareCopied(true);
      if (shareCopiedTimerRef.current != null) {
        window.clearTimeout(shareCopiedTimerRef.current);
      }
      shareCopiedTimerRef.current = window.setTimeout(() => {
        setShareCopied(false);
        shareCopiedTimerRef.current = null;
      }, 1600);
    } catch (err) {
      console.error('share copy failed', err);
    }
  }, [success?.shareId, shareHref]);

  const errorAssetId = error?.assetId || 'bitcoin';
  const errorOnAssetSurface = error
    ? isOnAssetOrCharacterPage(pathname, errorAssetId)
    : true;
  const errorAssetHref = assetSharePath(`/${errorAssetId}`, error?.shareId);

  const onErrorAction = useCallback(() => {
    if (!errorOnAssetSurface && error) {
      dismissError();
      router.push(errorAssetHref);
      return;
    }
    dismissError();
  }, [dismissError, error, errorAssetHref, errorOnAssetSurface, router]);

  if (!mounted) return null;

  return (
    <>
      {creatingModalOpen
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={overlayStyle}
              role="presentation"
            >
              <div
                className="blood-overlay-card blood-overlay-card--alien-creating"
                role="dialog"
                aria-modal="true"
                aria-labelledby={creatingTitleId}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="blood-overlay-creating-spinner" aria-hidden="true">
                  <span className="blood-overlay-creating-spinner-ring" />
                  <span className="blood-overlay-creating-profile" />
                </div>
                <p id={creatingTitleId} className="blood-overlay-copy">
                  <span className="blood-overlay-line">Creating your character</span>
                  <span className="blood-overlay-line">feel free to continue</span>
                  <span className="blood-overlay-line">to browse Arells</span>
                  <span className="blood-overlay-line">while you wait.</span>
                </p>
                <button
                  type="button"
                  className="asset-range-button blood-ok"
                  onClick={dismissCreatingModal}
                >
                  Ok
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

      {waitModalOpen
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={overlayStyle}
              onClick={dismissWaitModal}
              role="presentation"
            >
              <div
                className="blood-overlay-card blood-overlay-card--alien-error"
                role="dialog"
                aria-modal="true"
                aria-labelledby={waitTitleId}
                onClick={(event) => event.stopPropagation()}
              >
                <p id={waitTitleId} className="blood-overlay-copy">
                  <span className="blood-overlay-line">
                    Your {waitAssetName || creatingAssetName || 'asset'} Character
                  </span>
                  <span className="blood-overlay-line">is being created,</span>
                  <span className="blood-overlay-line">please wait</span>
                </p>
                <button
                  type="button"
                  className="asset-range-button blood-ok"
                  onClick={dismissWaitModal}
                >
                  Ok
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

      {errorOpen && error
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={overlayStyle}
              onClick={onErrorAction}
              role="presentation"
            >
              <div
                className="blood-overlay-card blood-overlay-card--alien-error"
                role="dialog"
                aria-modal="true"
                aria-labelledby={errorTitleId}
                onClick={(event) => event.stopPropagation()}
              >
                <p id={errorTitleId} className="blood-overlay-copy">
                  <span className="blood-overlay-line">Failed to</span>
                  <span className="blood-overlay-line">Upload Photo</span>
                  <span className="blood-overlay-line">Try Again</span>
                </p>
                <button
                  type="button"
                  className="asset-range-button blood-ok"
                  onClick={onErrorAction}
                >
                  {errorOnAssetSurface ? 'Ok' : 'Try Again'}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

      {success
        ? createPortal(
            <div className="blood-overlay is-visible" style={overlayStyle} role="presentation">
              <div
                className="blood-overlay-card blood-overlay-card--alien-meta"
                role="dialog"
                aria-modal="true"
                aria-label="Character updated"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="asset-alien-meta-created">
                  <p className="asset-alien-meta-created-title">
                    Character Creation Successful
                  </p>
                </div>
                <AlienMetaPreview
                  metaUrl={success.metaUrl}
                  loopUrl={success.loopUrl}
                  alt={`${success.assetName} Alien Race launch poster`}
                />
                <div className="asset-alien-meta-share">
                  <p className="asset-alien-meta-share-title">Share</p>
                  <div className="asset-alien-meta-share-row">
                    <button
                      type="button"
                      className="asset-alien-meta-share-copy"
                      onClick={() => void copyShareLink()}
                      disabled={!success.shareId}
                      aria-label="Copy share link"
                    >
                      {shareCopied ? 'Copied' : 'COPY'}
                    </button>
                    <span className="asset-alien-meta-share-link" title={shareHref}>
                      {shareHref}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="asset-range-button blood-ok blood-ok--alien-close"
                  onClick={onDismissSuccess}
                >
                  Close
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
