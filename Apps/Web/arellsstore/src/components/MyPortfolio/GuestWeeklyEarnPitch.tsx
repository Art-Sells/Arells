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
  if (!loadError && !guestMaxLabel) {
    return null;
  }

  return (
    <p className={className}>
      {loadError ? (
        <>Unable to load earnings info. Try again later.</>
      ) : layout === 'inline' ? (
        <span className="myportfolio-weekly-guest-pitch-earn">
          <span className="myportfolio-weekly-guest-pitch-earn-word">earn</span>{' '}
          <span className="myportfolio-weekly-guest-pitch-up-to">every week up to</span>
          {guestMaxLabel ? (
            <>
              <br />
              <span className="myportfolio-weekly-guest-pitch-amount">
                <span className="myportfolio-weekly-guest-pitch-dollar">$</span>
                <span className="myportfolio-weekly-guest-pitch-value">{guestMaxLabel}</span>
              </span>
            </>
          ) : null}
        </span>
      ) : (
        <span className="myportfolio-weekly-guest-pitch-earn">
          <span className="myportfolio-weekly-guest-pitch-earn-word">earn</span>
          <br />
          <span className="myportfolio-weekly-guest-pitch-up-to">up to </span>
          {guestMaxLabel ? (
            <span className="myportfolio-weekly-guest-pitch-amount">
              <span className="myportfolio-weekly-guest-pitch-dollar">$</span>
              <span className="myportfolio-weekly-guest-pitch-value">{guestMaxLabel}</span>
            </span>
          ) : null}
          <span className="myportfolio-weekly-guest-pitch-week"> a week</span>
        </span>
      )}
    </p>
  );
};

export default GuestWeeklyEarnPitch;
