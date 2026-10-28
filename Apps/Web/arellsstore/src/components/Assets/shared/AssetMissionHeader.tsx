'use client';

import React from 'react';
import { useAlienCharacterPresent } from '../../../hooks/useAlienCharacterPresent';

type AssetMissionHeaderProps = {
  title: string;
  /** When set, “My” only after a character photo exists; otherwise “Your”. */
  assetId?: string;
  line?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AssetMissionHeader({ title, assetId, line, children }: AssetMissionHeaderProps) {
  const hasCharacter = useAlienCharacterPresent(assetId);
  const possessive = assetId ? (hasCharacter ? 'My' : 'Your') : 'Your';

  return (
    <div className="asset-mission-header">
      <span className="asset-mission-header-icon" aria-hidden="true">
        <span className="home-guest-icon-tint asset-guest-icon-tint" />
      </span>
      <p className="asset-mission-header-line">
        {line ?? (
          <>
            <span className="asset-mission-possessive" aria-label={possessive}>
              <span
                className={`asset-mission-possessive-word${
                  possessive === 'Your' ? ' is-active' : ''
                }`}
                aria-hidden={possessive !== 'Your'}
              >
                Your
              </span>
              <span
                className={`asset-mission-possessive-word${
                  possessive === 'My' ? ' is-active' : ''
                }`}
                aria-hidden={possessive !== 'My'}
              >
                My
              </span>
            </span>{' '}
            {title}
            <br />
            investments can live forever.
          </>
        )}
      </p>
      {children}
    </div>
  );
}
