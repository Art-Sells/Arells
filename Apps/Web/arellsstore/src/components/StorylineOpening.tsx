'use client';

import React from 'react';

export type StorylineOpeningProps = {
  /** Empty → "your investments"; otherwise "your {assetName} investments". */
  assetName?: string;
  className?: string;
  label?: string;
  lines?: string[];
};

const BITCOIN_MEMORIAM_OPENING = [
  'The Bitcoin Alien Race come here often',
  'to mourn the lives of their loved ones',
  'who died every time Bitcoin lost value',
  'in our universe.',
];

const BITCOIN_MEMORIAM_CLOSING = [
  'These memoriams are plastered',
  'in almost every city they live and come',
  'in many shapes and sizes.',
];

function StorylineLines({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <span
      className={`storyline-opening-body myportfolio-text-chunks${className ? ` ${className}` : ''}`}
    >
      {lines.map((line, index) => (
        <React.Fragment key={line}>
          {index > 0 ? <span className="storyline-opening-row-break" aria-hidden="true" /> : null}
          <span>{line}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

export default function StorylineOpening({
  assetName,
  className,
  label = 'Storyline',
  lines,
}: StorylineOpeningProps) {
  const investmentsPhrase = assetName?.trim()
    ? `your ${assetName.trim()} investments`
    : 'your investments';

  const body = lines ? (
    lines.map((line, index) => (
      <React.Fragment key={line}>
        {index > 0 ? <span className="storyline-opening-row-break" aria-hidden="true" /> : null}
        <span>{line}</span>
      </React.Fragment>
    ))
  ) : (
    <>
      <span>In our universe,</span>
      <span className="storyline-opening-row-break" aria-hidden="true" />
      <span>{investmentsPhrase} are lifeless…</span>
      <span className="storyline-opening-row-break" aria-hidden="true" />
      <span>But in another universe, they are alive,</span>
      <span>and are on a mission to live forever.</span>
    </>
  );

  return (
    <div className={`storyline-opening${className ? ` ${className}` : ''}`}>
      <span className="storyline-opening-label">{label}</span>
      <span className="site-social-footer-rule storyline-opening-rule" aria-hidden="true" />
      <span className="storyline-opening-body myportfolio-text-chunks">{body}</span>
    </div>
  );
}

export function BitcoinMemoriamStoryline() {
  return (
    <div className="storyline-opening storyline-opening--bitcoin-teaser storyline-opening--memoriam">
      <span className="storyline-opening-label">The Bitcoin Memoriam</span>
      <span className="site-social-footer-rule storyline-opening-rule" aria-hidden="true" />
      <StorylineLines lines={BITCOIN_MEMORIAM_OPENING} />
      <span
        className="site-social-footer-rule storyline-opening-rule storyline-opening-mid-rule"
        aria-hidden="true"
      />
      <StorylineLines lines={BITCOIN_MEMORIAM_CLOSING} className="storyline-opening-body--memoriam-close" />
    </div>
  );
}
