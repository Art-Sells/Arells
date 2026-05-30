'use client';

import React from 'react';

type AssetSummaryCircleLoaderProps = {
  cssModifier: string;
  mounted: boolean;
  visible: boolean;
  fadingOut: boolean;
};

export default function AssetSummaryCircleLoader({
  cssModifier,
  mounted,
  visible,
  fadingOut,
}: AssetSummaryCircleLoaderProps) {
  if (!mounted) return null;

  return (
    <div
      className={`asset-summary-circle-loader asset-summary-circle-loader--${cssModifier}${
        visible ? ' is-visible' : ''
      }${fadingOut ? ' is-fading-out' : ''}`}
      aria-hidden="true"
    >
      <div className="asset-summary-circle-loader-ring" />
    </div>
  );
}
