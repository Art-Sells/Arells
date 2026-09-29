import React from 'react';

type AssetMissionHeaderProps = {
  title: string;
  children?: React.ReactNode;
};

export default function AssetMissionHeader({ title, children }: AssetMissionHeaderProps) {
  return (
    <div className="asset-mission-header">
      <span className="asset-mission-header-icon" aria-hidden="true">
        <span className="home-guest-icon-tint asset-guest-icon-tint" />
      </span>
      <p className="asset-mission-header-line">
        On a mission to ensure your
        <br />
        {title} investments live forever.
      </p>
      {children}
    </div>
  );
}
