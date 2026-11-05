'use client';

import Link from 'next/link';
import React from 'react';
import { emailVerifiedWelcomePhaseCopy } from '../../content/emailVerifiedWelcomeCopy';
import { useUser } from '../../context/UserContext';
import { assetSharePath } from '../../lib/assets/assetSharePath';

type PhaseOneBitcoinAlienRaceButtonProps = {
  className?: string;
  groupClassName?: string;
};

export default function PhaseOneBitcoinAlienRaceButton({
  className,
  groupClassName,
}: PhaseOneBitcoinAlienRaceButtonProps) {
  const { shareId } = useUser();
  const { label, href } = emailVerifiedWelcomePhaseCopy.bitcoinAlienRaceButton;
  const to = assetSharePath(href, shareId);
  return (
    <div className={`phase-one-bitcoin-alien-race-group myinv-accent-border${groupClassName ? ` ${groupClassName}` : ''}`}>
      <Link
        href={to}
        className={`phase-one-bitcoin-alien-race-button${className ? ` ${className}` : ''}`}
        aria-label={label}
      >
        <span className="phase-one-bitcoin-alien-race-button-text">{label}</span>
      </Link>
    </div>
  );
}
