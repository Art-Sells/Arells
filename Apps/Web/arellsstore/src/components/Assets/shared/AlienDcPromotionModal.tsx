'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DC_PROMOTION_VIDEO_URL,
  dismissDcPromotion,
} from '../../../lib/alienDcPromotion';

export type AlienDcPromotionModalProps = {
  open: boolean;
  onClose: () => void;
  assetName?: string;
  /** Theme CSS vars to paint the portal (asset page accents). */
  overlayStyle?: React.CSSProperties;
  /** When true, OK writes localStorage so auto-show never runs again. */
  persistOk?: boolean;
};

const AlienDcPromotionModal: React.FC<AlienDcPromotionModalProps> = ({
  open,
  onClose,
  overlayStyle,
  persistOk = true,
}) => {
  const titleId = useId();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setVideoReady(false);
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      /* autoplay may be blocked; muted + playsInline usually ok */
    });
  }, [open, videoReady]);

  const handleOk = useCallback(() => {
    if (persistOk) dismissDcPromotion();
    onClose();
  }, [persistOk, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="blood-overlay is-visible"
      style={overlayStyle}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="blood-overlay-card blood-overlay-card--dc-promo"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="asset-dc-promo-section">
          <p id={titleId} className="asset-dc-promo-headline">
            ADD YOUR CHARACTER
          </p>
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
          <p className="asset-dc-promo-coming-soon">COMING SOON</p>
        </div>
        <button type="button" className="asset-range-button blood-ok" onClick={handleOk}>
          OK
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AlienDcPromotionModal;
