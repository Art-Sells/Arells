'use client';

import Link from 'next/link';
import React from 'react';
import { emailVerifiedWelcomePhaseCopy } from '../../content/emailVerifiedWelcomeCopy';

type PhaseOneBitcoinAlienRaceButtonProps = {
  className?: string;
  groupClassName?: string;
};

export default function PhaseOneBitcoinAlienRaceButton({
  className,
  groupClassName,
}: PhaseOneBitcoinAlienRaceButtonProps) {
  const { label, href } = emailVerifiedWelcomePhaseCopy.bitcoinAlienRaceButton;
  return (
    <div className={`phase-one-bitcoin-alien-race-group myinv-accent-border${groupClassName ? ` ${groupClassName}` : ''}`}>
      <Link
        href={href}
        className={`phase-one-bitcoin-alien-race-button${className ? ` ${className}` : ''}`}
        aria-label={label}
      >
        <span className="phase-one-bitcoin-alien-race-button-text">{label}</span>
      </Link>
    </div>
  );
}
