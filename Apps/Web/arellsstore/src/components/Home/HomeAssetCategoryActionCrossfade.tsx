'use client';

import React from 'react';

type HomeAssetCategoryActionCrossfadeProps = {
  buttonLabel: string;
  showButton: boolean;
  comingSoonText: string;
  onButtonClick?: () => void;
  buttonClassName?: string;
  wrapClassName?: string;
};

const HomeAssetCategoryActionCrossfade: React.FC<HomeAssetCategoryActionCrossfadeProps> = ({
  buttonLabel,
  showButton,
  comingSoonText,
  onButtonClick,
  buttonClassName = 'auth-submit auth-submit--accent auth-submit--signup-page asset-range-button myinv-range-button home-assets-show-more-button',
  wrapClassName = '',
}) => (
  <div
    className={`home-assets-category-button-wrap home-asset-category-action-crossfade${wrapClassName ? ` ${wrapClassName}` : ''}`}
  >
    <button
      type="button"
      className={`${buttonClassName}${showButton ? ' is-visible' : ' is-hidden'}`}
      onClick={onButtonClick}
      aria-hidden={!showButton}
      tabIndex={showButton ? 0 : -1}
    >
      {buttonLabel}
    </button>
    <div
      className={`home-asset-category-coming-soon${showButton ? ' is-hidden' : ' is-visible'}`}
      aria-hidden={showButton}
    >
      {comingSoonText}
    </div>
  </div>
);

export default HomeAssetCategoryActionCrossfade;
