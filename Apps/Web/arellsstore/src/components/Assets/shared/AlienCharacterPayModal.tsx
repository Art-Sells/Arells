'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DC_PROMOTION_VIDEO_URL } from '../../../lib/alienDcPromotion';
import { startCharacterGenerationCheckout } from '../../../lib/client/characterGenerationPay';

export type AlienCharacterPayModalProps = {
  open: boolean;
  assetId?: string;
  /** Create (bitcoin PHOTO) vs update (my-character). */
  mode?: 'create' | 'update';
  overlayStyle?: React.CSSProperties;
  /** After an unused paid credit is confirmed (no redirect). */
  onPaid?: () => void;
  onDismiss?: () => void;
};

/**
 * Paywall before photo upload.
 * create: ADD YOUR CHARACTER + video + $4.99 + Create Character
 * update: video + $4.99 + Update Character (no title)
 */
const AlienCharacterPayModal: React.FC<AlienCharacterPayModalProps> = ({
  open,
  assetId = 'bitcoin',
  mode = 'create',
  overlayStyle,
  onPaid,
  onDismiss,
}) => {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const isUpdate = mode === 'update';
  const ctaLabel = isUpdate ? 'Update Character' : 'Create Character';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setLoadingPayment(false);
      setVideoReady(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      /* autoplay may be blocked */
    });
  }, [open, videoReady]);

  useEffect(() => {
    if (!open || !onDismiss || loadingPayment) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onDismiss, loadingPayment]);

  const handleCreate = useCallback(async () => {
    if (loadingPayment) return;
    setLoadingPayment(true);
    try {
      const result = await startCharacterGenerationCheckout(assetId);
      if (result === 'redirecting') return;
      onPaid?.();
    } catch (err) {
      console.error('character payment', err);
      window.alert(err instanceof Error ? err.message : 'Payment could not be started');
      setLoadingPayment(false);
    }
  }, [loadingPayment, assetId, onPaid]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="blood-overlay is-visible"
      style={overlayStyle}
      role="presentation"
      onClick={loadingPayment ? undefined : onDismiss}
    >
      <div
        className={`blood-overlay-card blood-overlay-card--dc-promo blood-overlay-card--character-pay${
          isUpdate ? ' blood-overlay-card--character-pay-update' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="asset-dc-promo-section">
          {!isUpdate ? (
            <p className="asset-dc-promo-headline">ADD YOUR CHARACTER</p>
          ) : null}
          <div className={`asset-dc-promo-frame${videoReady ? ' is-loaded' : ''}`}>
            <div className="asset-dc-promo-stage">
              <div
                className={`asset-dc-promo-loader${videoReady ? ' is-fading' : ''}`}
                aria-hidden="true"
              >
                <div className="asset-dc-promo-loader-ring" />
              </div>
              <video
                ref={videoRef}
                className={`asset-dc-promo-video${videoReady ? ' is-visible' : ''}`}
                src={DC_PROMOTION_VIDEO_URL}
                muted
                playsInline
                loop
                autoPlay
                preload="auto"
                onLoadedData={() => setVideoReady(true)}
                onCanPlay={() => setVideoReady(true)}
                aria-label="Dynamic characters promotion"
              />
            </div>
          </div>
          <div className="asset-character-pay-section">
            <p id={titleId} className="asset-character-pay-price">
              $4.99
            </p>
          </div>
          <button
            type="button"
            className={`asset-range-button blood-ok asset-dc-promo-add-photo asset-character-pay-cta${
              loadingPayment ? ' is-loading' : ''
            }`}
            onClick={handleCreate}
            disabled={loadingPayment}
            aria-busy={loadingPayment}
          >
            {loadingPayment ? (
              <>
                <span className="asset-character-pay-loader" aria-hidden="true" />
                <span>Loading Payment</span>
              </>
            ) : (
              <>
                <span className="asset-character-pay-profile-icon" aria-hidden="true" />
                <span>{ctaLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AlienCharacterPayModal;
