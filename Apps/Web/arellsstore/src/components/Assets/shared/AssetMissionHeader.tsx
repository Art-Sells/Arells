'use client';

import React from 'react';
import { useAlienSeasonOneLoopPresent } from '../../../hooks/useAlienSeasonOneLoopPresent';

type AssetMissionHeaderProps = {
  /** Kept for call-site compatibility; slogan always says “investments”. */
  title?: string;
  /** When set, “my” only after a personal Season One loop exists; otherwise “your”. */
  assetId?: string;
  line?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AssetMissionHeader({ assetId, line, children }: AssetMissionHeaderProps) {
  const hasSeasonOneLoop = useAlienSeasonOneLoopPresent(assetId);
  const possessive = assetId && hasSeasonOneLoop ? 'my' : 'your';

  return (
    <div className="asset-mission-header">
      <span
        className="asset-mission-header-icon asset-guest-mount-slide asset-guest-mount-slide--badge"
        aria-hidden="true"
      >
        <span className="home-guest-icon-tint asset-guest-icon-tint" />
      </span>
      <p className="asset-mission-header-line asset-guest-mount-slide asset-guest-mount-slide--slogan">
        {line ?? (
          <>
            on a mission to ensure
            <br />
            <span className="asset-mission-possessive" aria-label={possessive}>
              <span
                className={`asset-mission-possessive-word${
                  possessive === 'your' ? ' is-active' : ''
                }`}
                aria-hidden={possessive !== 'your'}
              >
                your
              </span>
              <span
                className={`asset-mission-possessive-word${
                  possessive === 'my' ? ' is-active' : ''
                }`}
                aria-hidden={possessive !== 'my'}
              >
                my
              </span>
            </span>{' '}
            investments never lose value
          </>
        )}
      </p>
      {children}
    </div>
  );
}
