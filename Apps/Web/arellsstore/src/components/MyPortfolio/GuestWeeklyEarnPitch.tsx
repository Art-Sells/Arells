'use client';

import React from 'react';

type Props = {
  guestMaxLabel: string;
  loadError: boolean;
  className?: string;
  layout?: 'stacked' | 'inline';
};

const GuestWeeklyEarnPitch: React.FC<Props> = ({
  guestMaxLabel,
  loadError,
  className = 'home-guest-slogan myportfolio-weekly-guest-pitch',
  layout = 'stacked',
}) => {
  // Hide the whole pitch when earnings can't be loaded — no error copy.
  if (loadError || !guestMaxLabel) {
    return null;
  }

  return (
    <p className={className}>
      {layout === 'inline' ? (
        <span className="myportfolio-weekly-guest-pitch-earn">
          <span className="myportfolio-weekly-guest-pitch-earn-word">earn</span>{' '}
          <span className="myportfolio-weekly-guest-pitch-up-to">every week up to</span>
          <br />
          <span className="myportfolio-weekly-guest-pitch-amount">
            <span className="myportfolio-weekly-guest-pitch-dollar">$</span>
            <span className="myportfolio-weekly-guest-pitch-value">{guestMaxLabel}</span>
          </span>
        </span>
      ) : (
        <span className="myportfolio-weekly-guest-pitch-earn">
          <span className="myportfolio-weekly-guest-pitch-earn-word">earn</span>
          <br />
          <span className="myportfolio-weekly-guest-pitch-up-to">up to </span>
          <span className="myportfolio-weekly-guest-pitch-amount">
            <span className="myportfolio-weekly-guest-pitch-dollar">$</span>
            <span className="myportfolio-weekly-guest-pitch-value">{guestMaxLabel}</span>
          </span>
          <span className="myportfolio-weekly-guest-pitch-week"> a week</span>
        </span>
      )}
    </p>
  );
};

export default GuestWeeklyEarnPitch;
