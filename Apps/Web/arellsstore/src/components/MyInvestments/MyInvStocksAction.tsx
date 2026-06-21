'use client';

import React from 'react';
import HomeAssetCategoryActionCrossfade from '../Home/HomeAssetCategoryActionCrossfade';

type MyInvStocksActionProps = {
  phase: 'button' | 'coming-soon';
  onStocksClick: () => void;
};

const MyInvStocksAction: React.FC<MyInvStocksActionProps> = ({ phase, onStocksClick }) => (
  <HomeAssetCategoryActionCrossfade
    buttonLabel="company stocks"
    showButton={phase === 'button'}
    comingSoonText="stocks coming soon"
    onButtonClick={onStocksClick}
    buttonClassName="auth-submit asset-range-button myinv-range-button myinv-hub-action-button home-assets-show-more-button"
    wrapClassName="myinv-asset-hub-stocks-action"
  />
);

export default MyInvStocksAction;
