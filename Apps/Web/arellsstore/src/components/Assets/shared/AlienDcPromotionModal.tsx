'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DC_PROMOTION_VIDEO_URL,
  DC_PROMO_BEST_RESULTS_GUIDE_SRC,
} from '../../../lib/alienDcPromotion';

export type AlienDcPromotionModalProps = {
  open: boolean;
  assetName?: string;
  /** Theme CSS vars to paint the portal (asset page accents). */
  overlayStyle?: React.CSSProperties;
  /**
   * Opens the photo picker. Modal stays open until the parent closes it
   * after a photo has been recorded (unless dismissed via backdrop).
   */
  onAddPhoto: () => void;
  /**
   * When set (Update Photo / empty PHOTO flows), tap outside closes the modal.
   * Auto-show host omits this so the modal stays until a photo is recorded.
   */
  onDismiss?: () => void;
};

const BEST_RESULTS_LINES = [
  'face forward, eyes open',
  'no hats, no glasses, no shades',
  'no smiling, no frowning',
  'no-one else in the photo, only you',
  'good lighting',
] as const;

/**
 * Stays visible until the parent sets open=false after a photo is recorded.
 * Backdrop / Escape do not dismiss.
 */
const AlienDcPromotionModal: React.FC<AlienDcPromotionModalProps> = ({
  open,
  overlayStyle,
  onAddPhoto,
  onDismiss,
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
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      /* autoplay may be blocked; muted + playsInline usually ok */
    });
  }, [open, videoReady]);

  useEffect(() => {
    if (!open || !onDismiss) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onDismiss]);

  const handleAddPhoto = useCallback(() => {
    onAddPhoto();
  }, [onAddPhoto]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="blood-overlay is-visible"
      style={overlayStyle}
      role="presentation"
      onClick={onDismiss}
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
          <div className="asset-dc-promo-best-results">
            <div className="asset-dc-promo-best-results-guide">
              <img
                className="asset-dc-promo-best-results-img"
                src={DC_PROMO_BEST_RESULTS_GUIDE_SRC}
                alt="Example photo: face forward, neutral expression, good lighting"
              />
            </div>
            <div className="asset-dc-promo-best-results-body">
              <p className="asset-dc-promo-best-results-title">For Best Results</p>
              <div className="asset-dc-promo-best-results-list">
                {BEST_RESULTS_LINES.map((line) => (
                  <span key={line} className="asset-dc-promo-best-results-line">
                    {line}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="asset-range-button blood-ok asset-dc-promo-add-photo"
          onClick={handleAddPhoto}
        >
          <svg
            className="asset-dc-promo-add-photo-icon"
            viewBox="0 0 24 24"
            width="26"
            height="26"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M9.2 3.5 7.6 5.5H5.25A2.25 2.25 0 0 0 3 7.75v9.5A2.25 2.25 0 0 0 5.25 19.5h13.5A2.25 2.25 0 0 0 21 17.25v-9.5A2.25 2.25 0 0 0 18.75 5.5H16.4l-1.6-2H9.2zM12 15.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5z"
            />
          </svg>
          <span>ADD PHOTO</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default AlienDcPromotionModal;
