'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import TBARLoadReveal from '../../components/Assets/Crypto/TBAR/LoadReveal';
import AlienRaceThemeMusicPlayer from '../../components/AlienRaceThemeMusicPlayer';
import TBARGrid from '../../components/Assets/Crypto/TBAR/Grid';
import AssetGuestLanding from '../../components/Assets/shared/AssetGuestLanding';
import StorylineOpening from '../../components/StorylineOpening';
import AssetSummaryCircleLoader from '../../components/Assets/shared/AssetSummaryCircleLoader';
import { useAssetSummaryCircleLoader } from '../../components/Assets/shared/useAssetSummaryCircleLoader';
import { useUser } from '../../context/UserContext';
import { useTBAR } from '../../components/Assets/Crypto/TBAR/useTBAR';
import { useGuestPreview } from '../../hooks/useGuestPreview';
import { splitTBARDaysAt, tbarThumbCount } from '../../lib/assets/crypto/TBAR/media';

const PREMIER_POSTER =
  'https://arellsusers.s3.us-west-1.amazonaws.com/marketing/assets/crypto/bitcoin/SignedIn/season1/posters/LaunchPoster(guest).jpg';

/** Inclusive cutoff: this day and newer = Weekly News; older = Other Updates. */
const TBAR_NEWS_CUTOFF_FOLDER = '10.16.26';

const TheBitcoinAlienRacePageClient: React.FC = () => {
  const { isSignedIn, authSessionLoading } = useUser();
  const { days, ready } = useTBAR();
  const hasContent = tbarThumbCount(days) > 0;
  const [showOtherUpdates, setShowOtherUpdates] = useState(false);
  const { news: newsDays, other: otherDays } = useMemo(
    () => splitTBARDaysAt(days, TBAR_NEWS_CUTOFF_FOLDER),
    [days]
  );
  const newsHasContent = tbarThumbCount(newsDays) > 0;
  const otherHasContent = tbarThumbCount(otherDays) > 0;
  const guestPreview = useGuestPreview();
  const allowSignedIn = !authSessionLoading && isSignedIn && !guestPreview;
  const showGuest = !authSessionLoading && (guestPreview || !isSignedIn);
  const pageLoader = useAssetSummaryCircleLoader();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!allowSignedIn && !showGuest) return;
    const bg = 'rgb(255, 247, 236)';
    const prevHtml = document.documentElement.style.getPropertyValue('--app-bg');
    const prevBody = document.body.style.getPropertyValue('--app-bg');
    document.documentElement.style.setProperty('--app-bg', bg);
    document.body.style.setProperty('--app-bg', bg);
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    return () => {
      if (prevHtml) document.documentElement.style.setProperty('--app-bg', prevHtml);
      else document.documentElement.style.removeProperty('--app-bg');
      if (prevBody) document.body.style.setProperty('--app-bg', prevBody);
      else document.body.style.removeProperty('--app-bg');
    };
  }, [allowSignedIn, showGuest]);

  useEffect(() => {
    if (!allowSignedIn) {
      pageLoader.dismissImmediately();
      return;
    }
    if (!ready) pageLoader.show();
    else pageLoader.dismissOnSummaryExpandComplete();
  }, [
    allowSignedIn,
    ready,
    pageLoader.show,
    pageLoader.dismissOnSummaryExpandComplete,
    pageLoader.dismissImmediately,
  ]);

  if (authSessionLoading) return null;

  if (showGuest) {
    return (
      <div className="asset-page asset-page--bitcoin">
        <header className="asset-header asset-header--bitcoin" />
        <AssetGuestLanding
          cssModifier="bitcoin"
          ticker="BTC"
          title="Bitcoin"
          posterSrc={PREMIER_POSTER}
          posterWidth={2000}
          posterHeight={1166}
          posterAlt="The Bitcoin Alien Race"
          smallIcon
          showTrailer
          hideWordmark
          hideSigninPrompt
        />
      </div>
    );
  }

  if (!allowSignedIn) return null;

  return (
    <>
      <div className="asset-page asset-page--bitcoin bitcoin-alien-race-page">
        <div className="bitcoin-alien-race-page-inner">
          <h1 className="asset-bitcoin-season-teaser-show-title bitcoin-alien-race-mount-slide bitcoin-alien-race-mount-slide--title asset-guest-mount-slide">
            The Bitcoin Alien Race
          </h1>
          <div className="bitcoin-alien-race-mount-slide bitcoin-alien-race-mount-slide--storyline asset-guest-mount-slide">
            <div className="asset-bitcoin-season-teaser-storyline">
              <StorylineOpening assetName="Bitcoin" className="storyline-opening--bitcoin-teaser" />
              <div className="asset-bitcoin-season-teaser-asset-block">
                <h2 className="tbar-date">Asset</h2>
                <div className="asset-bitcoin-season-teaser-badge">
                  <Link
                    href="/bitcoin"
                    className="myinv-asset-home-card home-asset-bitcoin bitcoin-alien-race-asset-card"
                    aria-label="Bitcoin"
                  >
                    <div className="home-assets-cell home-assets-asset">
                      <span className="home-asset-label home-asset-label-bitcoin">
                        <span className="home-asset-name asset-action-button asset-action-button--bitcoin asset-action-button--home-asset-chip">
                          Bitcoin
                        </span>
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="bitcoin-alien-race-mount-slide bitcoin-alien-race-mount-slide--updates asset-guest-mount-slide">
            <div
              className={`bitcoin-tbar-wrap${
                ready && hasContent ? ' is-open' : ''
              }${ready && !hasContent ? ' is-collapsing' : ''}`}
            >
              <div className="bitcoin-tbar-height">
                <h2 className="asset-bitcoin-season-teaser-season-title">Weekly News</h2>
                <TBARLoadReveal ready={ready} hasContent={newsHasContent} theme="bitcoin">
                  <TBARGrid
                    days={newsDays}
                    theme="bitcoin"
                    pageSize={Math.max(1, newsDays.filter((d) => d.media.length > 0).length)}
                  />
                </TBARLoadReveal>
                {ready && otherHasContent ? (
                  <div className="tbar-other-updates">
                    <h2 className="asset-bitcoin-season-teaser-season-title">Other Updates</h2>
                    {!showOtherUpdates ? (
                      <div className="home-assets-show-more-wrap tbar-more">
                        <button
                          type="button"
                          className="auth-submit asset-range-button asset-range-button--bitcoin home-assets-show-more-button"
                          onClick={() => setShowOtherUpdates(true)}
                        >
                          Show Updates
                        </button>
                      </div>
                    ) : (
                      <TBARGrid
                        days={otherDays}
                        theme="bitcoin"
                        pageSize={Math.max(1, otherDays.filter((d) => d.media.length > 0).length)}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AssetSummaryCircleLoader
        cssModifier="bitcoin"
        mounted={pageLoader.mounted}
        visible={pageLoader.visible}
        fadingOut={pageLoader.fadingOut}
      />
      <AlienRaceThemeMusicPlayer />
    </>
  );
};

export default TheBitcoinAlienRacePageClient;
