'use client';

import Link from 'next/link';
import React from 'react';
import { emailVerifiedWelcomePhaseCopy } from '../../content/emailVerifiedWelcomeCopy';

type PhaseOneBitcoinAlienRaceButtonProps = {
  className?: string;
};

export default function PhaseOneBitcoinAlienRaceButton({
  className,
}: PhaseOneBitcoinAlienRaceButtonProps) {
  const { label, href } = emailVerifiedWelcomePhaseCopy.bitcoinAlienRaceButton;
  return (
    <Link
      href={href}
      className={`phase-one-bitcoin-alien-race-button${className ? ` ${className}` : ''}`}
      aria-label={label}
    >
      <span className="phase-one-bitcoin-alien-race-button-text">{label}</span>
    </Link>
  );
}
