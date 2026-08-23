'use client';

import React from 'react';
import AlienRaceLoadReveal from '../AlienRaceLoadReveal';
import AlienRaceUpdatesGrid from '../AlienRaceUpdatesGrid';
import { useAlienRaceUpdates } from '../../hooks/useAlienRaceUpdates';
import { alienRaceThumbCount } from '../../lib/bitcoinAlienRaceUpdates';

type DailyUpdatesPanelProps = {
  slideIn: boolean;
};

export default function MyInvDailyUpdatesPanel({ slideIn }: DailyUpdatesPanelProps) {
  const { days, ready } = useAlienRaceUpdates();
  const hasContent = alienRaceThumbCount(days) > 0;

  return (
    <div className={slideIn ? 'page-slide-in' : undefined}>
    <div className={`myinv-panel-group myinv-panel-group--bordered myinv-asset-hub-group myinv-daily-updates-group${!ready ? ' is-loading' : ''}${ready && !hasContent ? ' is-collapsing' : ''}`}>
      <div className="myinv-panel-title myinv-panel-title--add myinv-title-accent">Daily Updates</div>
      <div className="myinv-panel-section myinv-daily-updates-frame myinv-asset-hub-outer">
        <div className="myinv-panel myinv-panel--shell myinv-asset-hub-outer-shell">
          <AlienRaceLoadReveal ready={ready} hasContent={hasContent} theme="myinv">
            <AlienRaceUpdatesGrid days={days} theme="myinv" imageHref="/thebitcoinalienrace" />
          </AlienRaceLoadReveal>
        </div>
      </div>
    </div>
    </div>
  );
}
