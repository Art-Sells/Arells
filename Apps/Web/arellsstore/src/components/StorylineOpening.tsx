'use client';

import React from 'react';

export type StorylineOpeningProps = {
  /** Empty → "your investments"; otherwise "your {assetName} investments". */
  assetName?: string;
  className?: string;
};

export default function StorylineOpening({ assetName, className }: StorylineOpeningProps) {
  const investmentsPhrase = assetName?.trim()
    ? `your ${assetName.trim()} investments`
    : 'your investments';

  return (
    <div className={`storyline-opening${className ? ` ${className}` : ''}`}>
      <span className="storyline-opening-label">Storyline</span>
      <span className="site-social-footer-rule storyline-opening-rule" aria-hidden="true" />
      <span className="storyline-opening-body myportfolio-text-chunks">
        <span>In our universe,</span>
        <span>{investmentsPhrase} are lifeless…</span>
        <span className="storyline-opening-row-break" aria-hidden="true" />
        <span>But in another universe, they are alive,</span>
        <span>and are on a mission to live forever.</span>
      </span>
    </div>
  );
}
