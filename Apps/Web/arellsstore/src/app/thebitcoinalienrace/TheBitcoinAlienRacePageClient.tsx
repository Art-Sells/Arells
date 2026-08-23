'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import AlienRaceLoadReveal from '../../components/AlienRaceLoadReveal';
import AlienRaceUpdatesGrid from '../../components/AlienRaceUpdatesGrid';
import StorylineOpening from '../../components/StorylineOpening';
import AssetSummaryCircleLoader from '../../components/Assets/shared/AssetSummaryCircleLoader';
import { useAssetSummaryCircleLoader } from '../../components/Assets/shared/useAssetSummaryCircleLoader';
import { useUser } from '../../context/UserContext';
import { useAlienRaceUpdates } from '../../hooks/useAlienRaceUpdates';
import { alienRaceThumbCount } from '../../lib/bitcoinAlienRaceUpdates';

const TheBitcoinAlienRacePageClient: React.FC = () => {
  const router = useRouter();
  const { isSignedIn, authSessionLoading } = useUser();
  const { days, ready } = useAlienRaceUpdates();
  const hasContent = alienRaceThumbCount(days) > 0;
  const allowPage = !authSessionLoading && isSignedIn;
  const pageLoader = useAssetSummaryCircleLoader();

  useEffect(() => {
    if (authSessionLoading) return;
    if (!isSignedIn) router.replace('/bitcoin');
  }, [authSessionLoading, isSignedIn, router]);

  useEffect(() => {
    if (!allowPage || typeof document === 'undefined') return;
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
  }, [allowPage]);

  useEffect(() => {
    if (!allowPage) {
      pageLoader.dismissImmediately();
      return;
    }
    if (!ready) pageLoader.show();
    else pageLoader.dismissOnSummaryExpandComplete();
  }, [
    allowPage,
    ready,
    pageLoader.show,
    pageLoader.dismissOnSummaryExpandComplete,
    pageLoader.dismissImmediately,
  ]);

  if (!allowPage) return null;

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
              <h2 className="alien-race-updates-date">Asset</h2>
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
          <div className={`bitcoin-alien-race-updates-wrap${ready && !hasContent ? ' is-collapsing' : ''}`}>
            <h2 className="asset-bitcoin-season-teaser-season-title">Updates</h2>
            <AlienRaceLoadReveal ready={ready} hasContent={hasContent} theme="bitcoin">
              <AlienRaceUpdatesGrid days={days} theme="bitcoin" />
            </AlienRaceLoadReveal>
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
    </>
  );
};

export default TheBitcoinAlienRacePageClient;
