'use client';

import Link from 'next/link';
import React from 'react';

type AssetMissionHeaderProps = {
  /** Kept for call-site compatibility; slogan always says “investments”. */
  title?: string;
  /** Kept for call-site compatibility. */
  assetId?: string;
  line?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AssetMissionHeader({ line, children }: AssetMissionHeaderProps) {
  return (
    <div className="asset-mission-header">
      <div className="asset-mission-header-icon asset-guest-mount-slide asset-guest-mount-slide--badge">
        <Link
          href="/"
          className="asset-action-button about-icon-button asset-mission-icon-button"
          aria-label="Arells"
        >
          <span className="about-icon asset-mission-icon" aria-hidden="true" />
        </Link>
      </div>
      <p className="asset-mission-header-line asset-guest-mount-slide asset-guest-mount-slide--slogan">
        {line ?? 'investments never die'}
      </p>
      {children}
    </div>
  );
}
