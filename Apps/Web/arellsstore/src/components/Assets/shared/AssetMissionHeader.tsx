import React from 'react';

type AssetMissionHeaderProps = {
  title: string;
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
        {line ?? <>{title} investments can live forever.</>}
      </p>
      {children}
    </div>
  );
}
