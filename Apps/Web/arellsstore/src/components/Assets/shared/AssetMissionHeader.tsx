'use client';

import React from 'react';

type AssetMissionHeaderProps = {
  title: string;
  /** Kept for call-site compat; mission copy no longer uses Your/My. */
  assetId?: string;
  line?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AssetMissionHeader({ title, line, children }: AssetMissionHeaderProps) {
  return (
    <div className="asset-mission-header">
      <span className="asset-mission-header-icon" aria-hidden="true">
        <span className="home-guest-icon-tint asset-guest-icon-tint" />
      </span>
      <p className="asset-mission-header-line">
        {line ?? (
          <>
            On a mission to ensure
            <br />
            {title} never loses value.
          </>
        )}
      </p>
      {children}
    </div>
  );
}
