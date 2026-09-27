'use client';

import Link from 'next/link';
import React from 'react';
import { emailVerifiedWelcomePhaseCopy } from '../../content/emailVerifiedWelcomeCopy';

type PhaseOneBitcoinAlienRaceButtonProps = {
  className?: string;
  groupClassName?: string;
  stackedLine?: boolean;
};

export default function PhaseOneBitcoinAlienRaceButton({
  className,
  groupClassName,
  stackedLine = false,
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
      <p className="phase-one-character-line">
        {stackedLine
          ? emailVerifiedWelcomePhaseCopy.characterInShowStackedLines.map((line) => (
              <span key={line} className="phase-one-character-line-row">
                {line}
              </span>
            ))
          : emailVerifiedWelcomePhaseCopy.characterInShowLine}
      </p>
    </div>
  );
}
