'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAlienCharacterCreate } from '../../../context/AlienCharacterCreateContext';
import { assetSharePath } from '../../../lib/assets/assetSharePath';
import { overlayStyleForAsset } from '../../../lib/client/alienCreateTheme';
import { markNavControlLoading } from '../../../lib/client/navCircleLoader';
import AlienMetaPreview from './AlienMetaPreview';

/** True on the asset home (optional shareId) or My Character routes for that asset. */
function isOnAssetOrCharacterPage(pathname: string, assetId: string): boolean {
  const id = assetId.trim().toLowerCase() || 'bitcoin';
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const assetHome = new RegExp(`^/${escaped}(?:/[a-z0-9]{6,64})?/?$`, 'i');
  const myCharacter = new RegExp(`^/${escaped}/my-character(?:/[a-z0-9]{6,64})?/?$`, 'i');
  return assetHome.test(pathname) || myCharacter.test(pathname);
}

/** TEMP: force the success modal open for the flush check. Remove after verify. */
const TEMP_CHARACTER_SUCCESS_PREVIEW = {
  assetId: 'bitcoin',
  assetName: 'Bitcoin',
  shareId: '115b56be62c3',
  metaUrl:
    '/api/public/alien-image?shareId=115b56be62c3&asset=bitcoin&kind=composedsquare',
  loopUrl:
    '/api/public/alien-video?shareId=115b56be62c3&asset=bitcoin&kind=metaloop',
  jobStartedAt: null,
};

/** Sitewide alien create modals: creating / wait / success / error. */
export default function AlienCharacterCreateHost() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const {
    creatingModalOpen,
    waitModalOpen,
    waitAssetName,
    success,
    error,
    errorOpen,
    overlayStyle,
    creatingAssetId,
    creatingAssetName,
    createProgress,
    dismissCreatingModal,
    dismissWaitModal,
    dismissSuccess,
    dismissError,
  } = useAlienCharacterCreate();
  const visibleSuccess = success ?? TEMP_CHARACTER_SUCCESS_PREVIEW;

  const [mounted, setMounted] = useState(false);
  const [closingSuccess, setClosingSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareCopiedTimerRef = useRef<number | null>(null);
  const creatingTitleId = useId();
  const waitTitleId = useId();
  const errorTitleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  /** Portal sits on document.body — force asset accents (bitcoin orange, etc.). */
  const themedOverlayStyle = overlayStyleForAsset(
    creatingAssetId || error?.assetId || visibleSuccess?.assetId || 'bitcoin',
    overlayStyle
  );

  useEffect(() => {
    return () => {
      if (shareCopiedTimerRef.current != null) {
        window.clearTimeout(shareCopiedTimerRef.current);
      }
    };
  }, []);

  const sharePath = assetSharePath(
    `/${visibleSuccess?.assetId === 'bitcoin' || !visibleSuccess?.assetId ? 'bitcoin' : visibleSuccess.assetId}`,
    visibleSuccess?.shareId
  );
  const shareHref =
    typeof window !== 'undefined' ? `${window.location.origin}${sharePath}` : sharePath;

  const onSuccessClose = useCallback(async () => {
    if (closingSuccess) return;
    setClosingSuccess(true);
    await dismissSuccess();
    window.location.reload();
  }, [closingSuccess, dismissSuccess]);

  const copyShareLink = useCallback(async () => {
    if (!visibleSuccess?.shareId) return;
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
  }, [visibleSuccess?.shareId, shareHref]);

  const errorAssetId = error?.assetId || 'bitcoin';
  const errorOnAssetSurface = error
    ? isOnAssetOrCharacterPage(pathname, errorAssetId)
    : true;
  const errorAssetHref = assetSharePath(`/${errorAssetId}`, error?.shareId);

  const onErrorAction = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      if (!errorOnAssetSurface && error) {
        if (event?.currentTarget) markNavControlLoading(event.currentTarget);
        dismissError();
        router.push(errorAssetHref);
        return;
      }
      dismissError();
    },
    [dismissError, error, errorAssetHref, errorOnAssetSurface, router]
  );

  if (!mounted) return null;

  return (
    <>
      {creatingModalOpen
        ? createPortal(
            <div
              className="blood-overlay is-visible"
              style={themedOverlayStyle}
              role="presentation"
            >
              <div
                className="blood-overlay-card blood-overlay-card--alien-creating"
                role="dialog"
                aria-modal="true"
                aria-labelledby={creatingTitleId}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="blood-overlay-creating-spinner"
                  aria-hidden="true"
                  aria-valuenow={createProgress ?? undefined}
                >
                  <span className="blood-overlay-creating-spinner-ring" />
                  {createProgress != null ? (
                    <span className="blood-overlay-creating-percent">{createProgress}%</span>
                  ) : (
                    <span className="blood-overlay-creating-profile" />
                  )}
                </div>
                <p id={creatingTitleId} className="blood-overlay-copy">
                  <span className="blood-overlay-line">Creating Character</span>
                </p>
                <div className="blood-overlay-creating-eta" aria-label="Estimated completion time">
                  <span className="blood-overlay-creating-eta-line">estimated</span>
                  <span className="blood-overlay-creating-eta-line">completion time</span>
                  <span className="blood-overlay-creating-eta-time">5-10~ minutes</span>
                </div>
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
              style={themedOverlayStyle}
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
              style={themedOverlayStyle}
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
                  {error.stage === 'upload' ? (
                    <>
                      <span className="blood-overlay-line">Failed to Upload Photo</span>
                      <span className="blood-overlay-line">Try Again</span>
                    </>
                  ) : (
                    <>
                      <span className="blood-overlay-line">Couldn’t finish</span>
                      <span className="blood-overlay-line">character create</span>
                      <span className="blood-overlay-line">Try Again</span>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  className="asset-range-button blood-ok"
                  onClick={onErrorAction}
                >
                  {error.stage === 'upload' || !errorOnAssetSurface ? 'Try Again' : 'Ok'}
                </button>
              </div>
            </div>,
            document.body
          )
        : null}

      {visibleSuccess
        ? createPortal(
            <div className="blood-overlay is-visible" style={themedOverlayStyle} role="presentation">
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
                  metaUrl={visibleSuccess.metaUrl}
                  loopUrl={visibleSuccess.loopUrl}
                  alt={`${visibleSuccess.assetName} Alien Race launch poster`}
                />
                <div className="asset-alien-meta-share">
                  <p className="asset-alien-meta-share-title">Share</p>
                  <div className="asset-alien-meta-share-row">
                    <button
                      type="button"
                      className="asset-alien-meta-share-copy"
                      onClick={() => void copyShareLink()}
                      disabled={!visibleSuccess.shareId}
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
                  onClick={() => void onSuccessClose()}
                  disabled={closingSuccess}
                  aria-busy={closingSuccess || undefined}
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
