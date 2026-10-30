'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import GuestLandingCopyright from '../GuestLandingCopyright';
import { usePosterLoopPlayback } from '../../hooks/usePosterLoopPlayback';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) =>
  `/${src}?w=${width}&q=${quality || 100}`;

const LAUNCH_POSTERS_BASE =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters';
const LAUNCH_POSTER = `${LAUNCH_POSTERS_BASE}/${encodeURIComponent('LaunchPoster(guest).jpg')}`;
const LAUNCH_POSTER_LOOP = `${LAUNCH_POSTERS_BASE}/${encodeURIComponent('LaunchLoop(guest).mp4')}`;

const PortfolioWeeklyGuestLanding: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stillImgRef = useRef<HTMLImageElement | null>(null);
  const [stillLoaded, setStillLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const {
    showStillLayer,
    showVideo,
    videoFadingOut,
    stillFadingOut,
    isHandoff,
    markReady,
    onVideoEnded,
    skipToStill,
  } = usePosterLoopPlayback(videoRef, true, undefined, 5000, undefined, stillLoaded);

  const showStill = showStillLayer && stillLoaded;
  /** Keep loader until the launch loop is actually playing — not just the still image. */
  const frameReady = videoPlaying || showStill;

  useEffect(() => {
    const img = stillImgRef.current;
    if (img?.complete && img.naturalWidth > 0) setStillLoaded(true);
  }, []);

  const onVideoPlaying = () => {
    markReady();
    setVideoPlaying(true);
  };

  return (
    <div className="home-guest-landing">
      <div className="home-guest-landing-stack">
        <span className="home-guest-icon-wrap home-guest-mount-slide home-guest-mount-slide--icon" aria-hidden="true">
          <span className="home-guest-icon-tint" aria-hidden="true" />
          <Image
            loader={imageLoader}
            alt=""
            width={45}
            height={45}
            className="home-guest-icon-img"
            src="images/Arells-Icon.png"
            priority
          />
        </span>
        <Image
          loader={imageLoader}
          alt="Arells"
          width={43}
          height={14}
          className="home-guest-logo home-guest-mount-slide home-guest-mount-slide--logo"
          src="images/Arells-Logo-Ebony.png"
          priority
        />
        <p className="home-guest-slogan myportfolio-weekly-guest-mission home-guest-mount-slide home-guest-mount-slide--slogan">
          investments can live forever
        </p>
        <div className="home-guest-signin-shell shadow-border-wrap home-guest-mount-slide home-guest-mount-slide--signin">
          <span className="shadow-border" aria-hidden="true" />
          <div
            className={`asset-guest-poster-frame asset-guest-poster-frame--loop home-guest-launch-poster${
              frameReady ? ' is-loaded' : ''
            }${showStill ? ' is-still' : ''}${isHandoff ? ' is-handoff' : ''}`}
            style={{ aspectRatio: '2000 / 1166' }}
          >
            {!frameReady ? (
              <div className="asset-guest-poster-loader" aria-hidden="true">
                <div className="asset-guest-poster-loader-ring" />
              </div>
            ) : null}
            <video
              ref={videoRef}
              className={`asset-guest-poster-video${showVideo ? ' is-visible' : ''}${
                videoFadingOut || !showVideo ? ' is-done' : ''
              }`}
              src={LAUNCH_POSTER_LOOP}
              muted
              playsInline
              preload="auto"
              autoPlay
              controls={false}
              disablePictureInPicture
              onLoadedData={markReady}
              onCanPlay={markReady}
              onPlaying={onVideoPlaying}
              onEnded={onVideoEnded}
              onError={() => {
                setVideoPlaying(false);
                skipToStill();
              }}
              aria-label="The Bitcoin Alien Race"
            />
            <img
              ref={stillImgRef}
              src={LAUNCH_POSTER}
              alt="The Bitcoin Alien Race"
              width={2000}
              height={1166}
              className={`asset-guest-poster-img${showStill ? ' is-visible' : ''}${
                stillFadingOut ? ' is-done' : ''
              }`}
              onLoad={() => setStillLoaded(true)}
            />
          </div>
          <div className="home-guest-signin-panel myinv-accent-border">
            <div className="home-guest-signin-inner">
              <p className="home-guest-signin-lead">Sign In to learn more</p>
              <Link
                href="/signin"
                className="auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button home-guest-signin-button"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <GuestLandingCopyright
          variant="home"
          className="myportfolio-weekly-guest-copyright home-guest-mount-slide home-guest-mount-slide--copyright"
        />
      </div>
    </div>
  );
};

export default PortfolioWeeklyGuestLanding;
