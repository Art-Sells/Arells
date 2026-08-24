'use client';

import React from 'react';
import AlienRaceLoadReveal from './AlienRaceLoadReveal';
import AlienRaceUpdatesGrid from './AlienRaceUpdatesGrid';
import { useAlienRaceUpdates } from '../hooks/useAlienRaceUpdates';
import { alienRaceThumbCount } from '../lib/bitcoinAlienRaceUpdates';

type AlienRaceDailyUpdatesProps = {
  variant: 'myinv' | 'bitcoin';
  mountExpand?: boolean;
};

export default function AlienRaceDailyUpdates({ variant, mountExpand = true }: AlienRaceDailyUpdatesProps) {
  const { days, ready } = useAlienRaceUpdates();
  const hasContent = alienRaceThumbCount(days) > 0;
  const open = Boolean(mountExpand && ready && hasContent);
  const theme = variant;
  const body = (
    <AlienRaceLoadReveal ready={ready} hasContent={hasContent} theme={theme}>
      <AlienRaceUpdatesGrid
        days={days}
        theme={theme}
        imageHref="/thebitcoinalienrace"
        usePreviewThumbs
        seekWidthPx={variant === 'bitcoin' ? 100 : undefined}
      />
    </AlienRaceLoadReveal>
  );

  if (variant === 'bitcoin') {
    if (ready && !hasContent) return null;
    if (!ready) return null;
    return (
      <div className="asset-bitcoin-season-teaser-updates">
        <h3 className="asset-bitcoin-season-teaser-season-title">Updates</h3>
        {body}
      </div>
    );
  }

  return (
    <div
      className={`myinv-panel-group myinv-panel-group--bordered myinv-asset-hub-group myinv-daily-updates-group${
        open ? ' is-open' : ''
      }${ready && !hasContent ? ' is-collapsing' : ''}`}
    >
      <div className="myinv-daily-updates-height">
      <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Updates</div>
      <div className="myinv-panel-section myinv-daily-updates-frame myinv-asset-hub-outer">
        <div className="myinv-panel myinv-panel--shell myinv-asset-hub-outer-shell">{body}</div>
      </div>
      </div>
    </div>
  );
}
